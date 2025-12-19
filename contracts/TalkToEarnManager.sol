// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@zetachain/protocol-contracts/contracts/zevm/interfaces/UniversalContract.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/IZRC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface INFTContract {
    function mint(address to, string memory uri) external;
}

contract TalkToEarnManager is UniversalContract, Ownable {
    INFTContract public nftContract;

    event CrossChainReceived(address indexed sender, uint256 amount, string message);
    event RewardsDistributed(address indexed recipient, uint256 amount);
    event CrossChainReverted(address indexed sender, address indexed asset, uint256 amount, bytes revertMessage);
    event Staked(bytes32 indexed contentId, address indexed user, address indexed zrc20, uint256 amount);
    event Unstaked(bytes32 indexed contentId, address indexed user, address indexed zrc20, uint256 amount);
    event RewardAdded(bytes32 indexed contentId, address indexed zrc20, uint256 amount);
    event RewardClaimed(bytes32 indexed contentId, address indexed user, address indexed zrc20, uint256 amount);

    struct StakeInfo {
        uint256 amount;
        uint256 rewardDebt; // accRewardPerShare1e18 * amount
    }

    // contentId => zrc20 => accRewardPerShare(1e18)
    mapping(bytes32 => mapping(address => uint256)) public accRewardPerShare1e18;
    // contentId => zrc20 => total staked
    mapping(bytes32 => mapping(address => uint256)) public totalStaked;
    // contentId => zrc20 => user => stake info
    mapping(bytes32 => mapping(address => mapping(address => StakeInfo))) public stakes;

    /**
     * @dev 构造函数
     * 1. 移除了 _gateway 参数：因为父类 UniversalContract 会自动处理 Gateway 连接（通常是硬编码或通过系统合约获取）。
     * 2. 移除了父类构造函数调用：UniversalContract 没有构造函数参数。
     */
    constructor(address _nftContract) Ownable(msg.sender) {
        nftContract = INFTContract(_nftContract);//这里没有校验 _nftContract != address(0)，部署时要保证地址正确
    }

    /**
     * @dev ZetaChain v7 核心回调函数
     * 使用 override 覆盖父类的抽象定义
     * 直接使用父类自带的 onlyGateway 修饰符
     */
    function onCall(
        MessageContext calldata context,
        address zrc20,
        uint256 amount,
        bytes calldata message
    ) external override onlyGateway {
        address recipient = context.senderEVM;
        
        // 兼容非 EVM 链的地址处理
        if (recipient == address(0) && context.sender.length == 20) {
            recipient = address(bytes20(context.sender));
        }
        
        if (recipient == address(0)) {
            return;
        }

        // 默认 tokenURI；优先尝试 ABI 解码 message 为 string（推荐使用 abi.encode(string tokenURI) 作为 payload）
        // 解码失败时再尝试把 message 当作 UTF-8 字符串，并且要求前缀 ipfs:// 才使用
        string memory tokenURI = "ipfs://default_v7";
        if (message.length > 0) {
            (string memory decoded, bool ok) = _decodeTokenURI(message);
            if (ok && _startsWith(decoded, "ipfs://")) {
                tokenURI = decoded;
            } else {
                // 兼容旧的 UTF-8 直接传法
                string memory candidate = string(message);
                if (_startsWith(candidate, "ipfs://")) {
                    tokenURI = candidate;
                }
            }
        }

        // 执行业务逻辑：铸造 NFT
        nftContract.mint(recipient, tokenURI);
        emit CrossChainReceived(recipient, amount, tokenURI);

        // 结算：如果这次跨链调用携带了 ZRC20 资产（depositAndCall 场景），则把收到的资产直接转给触发者。
        // 如果你希望“资金留在合约里、由管理员批量分发”，可以改为不在这里 transfer，转而只用 distributeRewards。
        if (amount > 0 && zrc20 != address(0)) {
            bool ok = IZRC20(zrc20).transfer(recipient, amount);
            require(ok, "ZRC20 transfer failed");
            emit RewardsDistributed(recipient, amount);
        }
    }

    /**
     * @dev 必须实现 onRevert 以满足接口要求
     * 移除了 'override' 关键字，因为父类可能并未将其定义为 virtual，或者它是接口的一部分
     * 如果编译报错提示 "missing override"，请再加回去；但根据你的报错，这里不应该加。
     */
    function onRevert(
        RevertContext calldata context
    ) external onlyGateway {
        // 处理跨链调用失败后的回滚逻辑（例如退款）
        // 即使为空也必须实现
        emit CrossChainReverted(context.sender, context.asset, context.amount, context.revertMessage);
    }

    function distributeRewards(
        address zrc20RewardToken, 
        address[] calldata recipients, 
        uint256[] calldata amounts
    ) external onlyOwner {
        require(recipients.length == amounts.length, "Length mismatch");
        for (uint256 i = 0; i < recipients.length; i++) {
            bool ok = IZRC20(zrc20RewardToken).transfer(recipients[i], amounts[i]);
            require(ok, "ZRC20 transfer failed");
            emit RewardsDistributed(recipients[i], amounts[i]);
        }
    }

    // 支持 GatewayZEVM 的 ZETA (native) depositAndCall：目标合约需要能接收 value
    receive() external payable {}

    // --------------------------- Staking & Rewards ---------------------------

    /**
     * @notice 质押 ZRC20 到某个 contentId（比如 files.json 的 key 或内容哈希）
     * @param contentId 内容标识（建议使用 keccak256(bytes(key))）
     * @param zrc20 ZRC20 代币地址
     * @param amount 质押数量
     */
    function stake(bytes32 contentId, address zrc20, uint256 amount) external {
        require(amount > 0, "amount=0");

        StakeInfo storage s = stakes[contentId][zrc20][msg.sender];
        _harvest(contentId, zrc20, msg.sender, s);

        totalStaked[contentId][zrc20] += amount;
        s.amount += amount;
        s.rewardDebt = (s.amount * accRewardPerShare1e18[contentId][zrc20]) / 1e18;

        bool ok = IZRC20(zrc20).transferFrom(msg.sender, address(this), amount);
        require(ok, "stake transfer failed");
        emit Staked(contentId, msg.sender, zrc20, amount);
    }

    /**
     * @notice 解押
     */
    function unstake(bytes32 contentId, address zrc20, uint256 amount) external {
        StakeInfo storage s = stakes[contentId][zrc20][msg.sender];
        require(amount > 0 && amount <= s.amount, "invalid amount");

        _harvest(contentId, zrc20, msg.sender, s);

        s.amount -= amount;
        totalStaked[contentId][zrc20] -= amount;
        s.rewardDebt = (s.amount * accRewardPerShare1e18[contentId][zrc20]) / 1e18;

        bool ok = IZRC20(zrc20).transfer(msg.sender, amount);
        require(ok, "unstake transfer failed");
        emit Unstaked(contentId, msg.sender, zrc20, amount);
    }

    /**
     * @notice 仅 owner 可调用：把 rewardAmount 按质押占比分配给 contentId 的质押者
     * @dev 奖励资金从合约余额扣除，若余额不足则按余额上限发放
     */
    function rewardOnUse(bytes32 contentId, address zrc20, uint256 rewardAmount) external onlyOwner {
        uint256 total = totalStaked[contentId][zrc20];
        require(total > 0, "no stakes");
        require(rewardAmount > 0, "amount=0");

        uint256 balance = IZRC20(zrc20).balanceOf(address(this));
        uint256 amount = rewardAmount > balance ? balance : rewardAmount;
        require(amount > 0, "insufficient balance");

        // acc += amount / total
        accRewardPerShare1e18[contentId][zrc20] += (amount * 1e18) / total;
        emit RewardAdded(contentId, zrc20, amount);
    }

    /**
     * @notice 领取某 contentId 的待领取奖励
     */
    function claim(bytes32 contentId, address zrc20) external {
        StakeInfo storage s = stakes[contentId][zrc20][msg.sender];
        _harvest(contentId, zrc20, msg.sender, s);
        s.rewardDebt = (s.amount * accRewardPerShare1e18[contentId][zrc20]) / 1e18;
    }

    /**
     * @notice 查询待领取奖励
     */
    function pendingRewards(bytes32 contentId, address zrc20, address user) external view returns (uint256) {
        StakeInfo storage s = stakes[contentId][zrc20][user];
        uint256 acc = accRewardPerShare1e18[contentId][zrc20];
        return (s.amount * acc) / 1e18 - s.rewardDebt;
    }

    function _harvest(bytes32 contentId, address zrc20, address user, StakeInfo storage s) private {
        if (s.amount == 0) return;
        uint256 acc = accRewardPerShare1e18[contentId][zrc20];
        uint256 pending = (s.amount * acc) / 1e18 - s.rewardDebt;
        if (pending > 0) {
            bool ok = IZRC20(zrc20).transfer(user, pending);
            require(ok, "reward transfer failed");
            emit RewardClaimed(contentId, user, zrc20, pending);
        }
    }

    function _decodeTokenURI(bytes calldata message) private view returns (string memory, bool) {
        // 使用 staticcall 捕获 abi.decode 失败，不让整个 onCall revert
        (bool success, bytes memory ret) = address(this).staticcall(
            abi.encodeWithSelector(this.__decodeString.selector, message)
        );
        if (!success || ret.length == 0) {
            return ("", false);
        }
        return (abi.decode(ret, (string)), true);
    }

    function _startsWith(string memory str, string memory prefix) private pure returns (bool) {
        bytes memory s = bytes(str);
        bytes memory p = bytes(prefix);
        if (p.length > s.length) return false;
        for (uint256 i = 0; i < p.length; i++) {
            if (s[i] != p[i]) return false;
        }
        return true;
    }

    // 供 _decodeTokenURI 通过 staticcall 捕获解码错误
    function __decodeString(bytes calldata data) external pure returns (string memory) {
        return abi.decode(data, (string));
    }
}
