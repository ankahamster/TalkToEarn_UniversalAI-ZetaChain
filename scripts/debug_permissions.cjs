// scripts/debug_permissions.cjs
const hre = require("hardhat");

async function main() {
  // ================= 配置区 (请确保是最新部署的地址) =================
  const NFT_ADDR = "0x7abbD946795CEf5Afc33DEb4f1b4DD59F534f7Ec";
  const MANAGER_ADDR = "0xD7BF0f6Ec8Cb9b8f334cfe012D1021d54Dc273b4";
  // ==============================================================

  const [signer] = await hre.ethers.getSigners();
  console.log("🕵️‍♂️ 正在诊断合约权限...");
  console.log(`当前操作账户: ${signer.address}`);
  console.log("---------------------------------------------------");

  // 连接 NFT 合约
  const nft = await hre.ethers.getContractAt("SimpleMintOnlyNFT", NFT_ADDR);
  
  // 1. 获取当前所有者
  const currentOwner = await nft.owner();
  console.log(`🏠 NFT 当前所有者 (Owner): ${currentOwner}`);
  console.log(`🤖 目标 Manager 地址:      ${MANAGER_ADDR}`);

  // 2. 比较地址 (注意转为小写比较)
  if (currentOwner.toLowerCase() === MANAGER_ADDR.toLowerCase()) {
    console.log("---------------------------------------------------");
    console.log("✅ [状态完美] NFT 的控制权已经在 Manager 手中。");
    console.log("👉 结论: 权限设置没有问题。");
    console.log("👉 如果你在 ZetaChain 上一直查不到 CCTX：优先检查“源链 Gateway 地址是否正确”。");
    console.log("👉 建议：运行最新的 'test_crosschain.cjs'（已改为自动从地址表取 Gateway），然后用 'hardhat cctx --timeout 600 <txHash>' 跟踪。");
  
  } else if (currentOwner.toLowerCase() === signer.address.toLowerCase()) {
    console.log("---------------------------------------------------");
    console.log("❌ [发现问题] NFT 的控制权还在【你】手里，而不是 Manager！");
    console.log("😱 后果: Manager 试图发奖时会被拒绝，导致跨链交易失败。");
    
    // 3. 自动修复逻辑
    console.log("\n🛠️ 正在自动修复... (移交权限给 Manager)");
    try {
      const tx = await nft.transferOwnership(MANAGER_ADDR);
      console.log("⏳ 交易已发送，等待确认...");
      await tx.wait();
      console.log("🎉 [修复成功] 权限已移交！现在 Manager 是老板了。");
      console.log("👉 建议: 现在请重新运行 'test_crosschain.cjs'，这次应该能成功！");
    } catch (err) {
      console.error("💥 修复失败:", err.message);
    }

  } else {
    console.log("---------------------------------------------------");
    console.log("⚠️ [严重未知] NFT 的所有者既不是你，也不是 Manager。");
    console.log("👉 请检查配置文件中的地址是否填错了？");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
