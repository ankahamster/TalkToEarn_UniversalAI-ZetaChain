// scripts/test_crosschain.cjs
const hre = require("hardhat");
const protocolContracts = require("@zetachain/protocol-contracts");

async function main() {
  // ================= 配置区 =================
  const TARGET_MANAGER_ADDRESS = "0xD7BF0f6Ec8Cb9b8f334cfe012D1021d54Dc273b4"; // Zeta 上的 Manager
  const TOKEN_URI = process.env.TOKEN_URI?.trim() || "ipfs://<your_cid>";
  // =========================================

  const [signer] = await hre.ethers.getSigners();
  const network = await hre.ethers.provider.getNetwork();
  const chainId = Number(network.chainId);

  // 自动取 BSC Testnet GatewayEVM 地址（可用 GATEWAY_EVM 覆盖）
  const byNetworkName = protocolContracts.getAddress("gateway", hre.network.name);
  const byChainId = protocolContracts.testnet
    .concat(protocolContracts.mainnet)
    .find((n) => n.type === "gateway" && n.chain_id === chainId)?.address;
  const gatewayAddress = process.env.GATEWAY_EVM?.trim() || byNetworkName || byChainId;
  if (!gatewayAddress) throw new Error(`No GatewayEVM for chainId=${chainId}`);

  console.log("🚀 From BSC Testnet send cross-chain...");
  console.log("📝 Signer:", signer.address);
  console.log("🏛️ Gateway:", gatewayAddress);
  console.log("🎯 Manager:", TARGET_MANAGER_ADDRESS);
  console.log("🎨 tokenURI:", TOKEN_URI);

  const gatewayAbi = [
    "function call(address receiver, bytes payload, tuple(address revertAddress,bool callOnRevert,address abortAddress,bytes revertMessage,uint256 onRevertGasLimit) revertOptions) external payable"
  ];
  const gateway = new hre.ethers.Contract(gatewayAddress, gatewayAbi, signer);

  // payload = abi.encode(string)
  const payload = hre.ethers.AbiCoder.defaultAbiCoder().encode(["string"], [TOKEN_URI]);
  const revertOptions = {
    revertAddress: hre.ethers.ZeroAddress,
    callOnRevert: false,
    abortAddress: hre.ethers.ZeroAddress,
    revertMessage: "0x",
    onRevertGasLimit: 0
  };

  const tx = await gateway.call(TARGET_MANAGER_ADDRESS, payload, revertOptions);
  console.log("⏳ Tx sent:", tx.hash);
  await tx.wait();
  console.log("✅ Cross-chain request sent. Track with:");
  console.log(`   npx hardhat cctx --timeout 600 ${tx.hash}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
