// scripts/test_crosschain.cjs
const hre = require("hardhat");
const protocolContracts = require("@zetachain/protocol-contracts");

async function main() {
  // ================= 配置区 =================
  // 你的 TalkToEarnManager 地址 (请确认没填错)
  const TARGET_MANAGER_ADDRESS = "0xD7BF0f6Ec8Cb9b8f334cfe012D1021d54Dc273b4"; 
 
  // ===========================================

  const [signer] = await hre.ethers.getSigners();
  const network = await hre.ethers.provider.getNetwork();
  const chainId = Number(network.chainId);

  // 使用 @zetachain/protocol-contracts 内置的地址表，避免手填错 Gateway 地址导致 CCTX 查不到。
  // 优先使用 Hardhat network name（例如 bsc_testnet），失败则 fallback 到 chainId 匹配。
  // 也支持通过环境变量覆盖（比如你想手动指定某个 Gateway）。
  const byNetworkName = protocolContracts.getAddress("gateway", hre.network.name);
  const byChainId = protocolContracts.testnet
    .concat(protocolContracts.mainnet)
    .find((n) => n.type === "gateway" && n.chain_id === chainId)?.address;
  const gatewayAddress = process.env.GATEWAY_EVM?.trim() || byNetworkName || byChainId;

  if (!gatewayAddress) {
    throw new Error(`No ZetaChain GatewayEVM address found for chainId=${chainId}`);
  }

  console.log("🚀 正在从 BSC Testnet 发起跨链调用...");
  console.log("📝 操作账号:", signer.address);
  console.log("🌐 当前网络 chainId:", chainId);
  console.log("🏛️  使用 GatewayEVM:", gatewayAddress);

  // 你想铸造的 tokenURI（metadata CID），可以通过环境变量 TOKEN_URI 覆盖
  const tokenURI =
    process.env.TOKEN_URI?.trim() ||
    "ipfs://QmRNQYgKE9Azx5F64C889uMYubLrncLgZo8HDnbaetPyop"; // exercise 示例

  // Gateway ABI
  const gatewayAbi = [
    "function call(address receiver, bytes calldata payload, tuple(address revertAddress, bool callOnRevert, address abortAddress, bytes revertMessage, uint256 onRevertGasLimit) revertOptions) external payable" 
    // 注意：上面加了 payable 关键字，虽然 ethers.js 不强制，但加上更规范
  ];

  const gateway = new hre.ethers.Contract(gatewayAddress, gatewayAbi, signer);

  // 推荐：payload 使用 ABI 编码，manager 端会 abi.decode(bytes,(string)) 得到 tokenURI
  const payload = hre.ethers.AbiCoder.defaultAbiCoder().encode(["string"], [tokenURI]);
  const revertOptions = {
    revertAddress: "0x0000000000000000000000000000000000000000",
    callOnRevert: false,
    abortAddress: "0x0000000000000000000000000000000000000000",
    revertMessage: "0x",
    onRevertGasLimit: 0
  };

  console.log("📡 正在调用 Gateway 发送信号...");
  console.log("🎯 tokenURI:", tokenURI);

  // 注意：GatewayEVM 的第一笔跨链动作通常 fee=0，传入任何 msg.value 都可能触发 ExcessETHProvided 而回滚。
  const tx = await gateway.call(TARGET_MANAGER_ADDRESS, payload, revertOptions);

  console.log("⏳ 交易已发送，等待上链...");
  await tx.wait();

  console.log("✅ 跨链请求发送成功！");
  console.log(`🔗 BSC 交易哈希: ${tx.hash}`);
  console.log("--------------------------------------------------");
  console.log("👀 请等待 1-2 分钟，然后运行 'verify_deployment.cjs' 或 'check_nft_balance.cjs' 查看结果。");
  console.log("   CCTX 跟踪建议：npx hardhat cctx --timeout 600 " + tx.hash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
