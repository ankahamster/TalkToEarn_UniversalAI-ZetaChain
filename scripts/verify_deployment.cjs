// scripts/verify_deployment.cjs
const hre = require("hardhat");

async function main() {
  // 1. 配置合约地址 (你刚才部署的地址)
  const MANAGER_ADDR = "0x6a5B86085CE2818Ae41aC0A089C83fd100a7bCB8";
  const NFT_ADDR = "0xB7277D1C77B6239910f0F67ad72A23cB13a6Df66";

  const [signer] = await hre.ethers.getSigners();
  console.log("🔍 正在使用账户进行验证:", signer.address);
  console.log("------------------------------------------------------");

  // 2. 连接到 NFT 合约
  const nft = await hre.ethers.getContractAt("SimpleMintOnlyNFT", NFT_ADDR);
  const nftName = await nft.name();
  const nftSymbol = await nft.symbol();
  const nftOwner = await nft.owner(); // 获取 NFT 合约的所有者

  console.log(`🎨 NFT 合约信息:`);
  console.log(`   - 地址: ${NFT_ADDR}`);
  console.log(`   - 名称: ${nftName}`);
  console.log(`   - 代号: ${nftSymbol}`);
  console.log(`   - 当前 Owner: ${nftOwner}`);

  // 验证 NFT 权限
  if (nftOwner.toLowerCase() === MANAGER_ADDR.toLowerCase()) {
    console.log("   ✅ 权限检查通过: NFT 的所有权已移交给 Manager 合约。");
  } else {
    console.log("   ❌ 权限检查失败: NFT 的所有者不是 Manager！Manager 将无法铸造 NFT。");
    console.log("      (请检查部署脚本中的 transferOwnership 步骤)");
  }
  console.log("------------------------------------------------------");

  // 3. 连接到 Manager 合约
  const manager = await hre.ethers.getContractAt("TalkToEarnManager", MANAGER_ADDR);
  const managerOwner = await manager.owner();

  console.log(`⚙️  Manager 合约信息:`);
  console.log(`   - 地址: ${MANAGER_ADDR}`);
  console.log(`   - 当前 Owner: ${managerOwner}`);
  
  // 验证 Manager 权限
  if (managerOwner.toLowerCase() === signer.address.toLowerCase()) {
    console.log("   ✅ 权限检查通过: 你是 Manager 的管理员。");
  } else {
    console.log("   ⚠️ 警告: 你不是 Manager 的管理员，可能无法提取收益。");
  }

  console.log("------------------------------------------------------");
  console.log("🎉 验证完成！如果全绿，说明系统内部连接正常。");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});