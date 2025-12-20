const hre = require("hardhat");
const protocolContracts = require("@zetachain/protocol-contracts");
const { ethers } = hre;

/**
 * 把 BSC Testnet 的 BNB 跨到 ZetaChain，生成 BNB.zrc20。
 * 使用 GatewayEVM 的 depositAndCall(native) 版本，payload 为空。
 */
async function main() {
  const [signer] = await ethers.getSigners();
  console.log("🚀 开始充值 BNB (BSC -> ZetaChain)...");
  console.log("   账户:", signer.address);

  // ========== 配置 ==========
  const chainId = Number((await ethers.provider.getNetwork()).chainId);
  if (chainId !== 97) {
    throw new Error(`请在 BSC Testnet 网络运行，本次 chainId=${chainId}`);
  }

  // 优先环境变量覆盖，其次用地址表
  const byNetworkName = protocolContracts.getAddress("gateway", hre.network.name);
  const byChainId = protocolContracts.testnet
    .concat(protocolContracts.mainnet)
    .find((n) => n.type === "gateway" && n.chain_id === chainId)?.address;
  const gatewayAddress = process.env.GATEWAY_EVM?.trim() || byNetworkName || byChainId;
  if (!gatewayAddress) throw new Error("未找到 GatewayEVM 地址");

  const receiver = process.env.RECEIVER?.trim() || signer.address;
  const depositAmount = ethers.parseEther(process.env.AMOUNT_BNB || "0.05");

  console.log("   GatewayEVM:", gatewayAddress);
  console.log("   Receiver  :", receiver);
  console.log("   Amount    :", ethers.formatEther(depositAmount), "BNB");

  // Gas 设置：BSC Testnet 需要 tip cap >= 100000000 wei (~0.1 gwei)
  const minGasPrice = ethers.parseUnits(process.env.MIN_GAS_PRICE_GWEI || "2", "gwei");
  const networkGasPrice = (await signer.provider.getGasPrice?.()) || minGasPrice;
  const gasPrice = networkGasPrice < minGasPrice ? minGasPrice : networkGasPrice;
  console.log("   GasPrice  :", ethers.formatUnits(gasPrice, "gwei"), "gwei");

  // 原生 BNB 存入：depositAndCall(address receiver, bytes payload, RevertOptions revertOptions)
  // 不携带 payload，msg.value 即跨链金额
  const abi = [
    "function depositAndCall(address receiver, bytes payload, tuple(address revertAddress,bool callOnRevert,address abortAddress,bytes revertMessage,uint256 onRevertGasLimit) revertOptions) external payable"
  ];
  const gateway = new ethers.Contract(gatewayAddress, abi, signer);
  const revertOptions = {
    revertAddress: ethers.ZeroAddress,
    callOnRevert: false,
    abortAddress: ethers.ZeroAddress,
    revertMessage: "0x",
    onRevertGasLimit: 0
  };

  console.log("\n💸 正在向 Gateway 存入 BNB...");
  const tx = await gateway.depositAndCall(receiver, "0x", revertOptions, {
    value: depositAmount,
    gasPrice
  });
  console.log("   Tx Hash:", tx.hash);
  console.log("   等待交易上链...");
  await tx.wait();
  console.log("✅ BSC 链上确认，等待 ZetaChain 铸造 BNB.zrc20 (通常 1-3 分钟)");
  console.log(`👉 可用命令跟踪: npx hardhat cctx --timeout 600 ${tx.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
