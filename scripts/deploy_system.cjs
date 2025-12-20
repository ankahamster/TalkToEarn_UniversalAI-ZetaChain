const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // 1. 部署 NFT
  const NFT = await hre.ethers.getContractFactory("SimpleMintOnlyNFT");
  const nft = await NFT.deploy("UniversalAI NFT", "UAIN");
  await nft.waitForDeployment();
  console.log("NFT deployed to:", nft.target);

  // 2. 部署 Manager
  // ⚠️ 修改点：不需要再手动传 Gateway 地址了，v7 合约会自动处理
  const Manager = await hre.ethers.getContractFactory("TalkToEarnManager");
  const manager = await Manager.deploy(nft.target); // 👈 只传 NFT 地址
  await manager.waitForDeployment();
  console.log("Manager deployed to:", manager.target);

  // 3. 移交权限
  await nft.transferOwnership(manager.target);
  console.log("Ownership transferred to Manager.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});