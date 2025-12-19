const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("🕵️  正在使用账户进行质押测试:", signer.address);

  // ================= 配置区域 =================
  // 1. 你的 TalkToEarnManager 合约地址
  const MANAGER_ADDR = "0xD7BF0f6Ec8Cb9b8f334cfe012D1021d54Dc273b4"; 
  
  // 2. 刚才验证过的 BSC Testnet ZRC20-BNB 地址 (硬编码)
  const ZRC20_BNB_ADDR = "0xd97B1de3619ed2c6BEb3860147E30cA8A7dC9891"; 
  // ===========================================

  // 连接 ZRC20 合约并检查余额
  const zrc20 = await ethers.getContractAt("IZRC20", ZRC20_BNB_ADDR);
  const balance = await zrc20.balanceOf(signer.address);
  console.log(`\n💰 当前 ZRC20-BNB 余额: ${ethers.formatUnits(balance, 18)}`);

  // 准备质押 0.0001 个代币
  const stakeAmount = ethers.parseUnits("0.0001", 18); 

  if (balance < stakeAmount) {
    console.error("❌ 余额不足！请先等待充值到账。");
    return;
  }

  // 连接 Manager 合约
  const manager = await ethers.getContractAt("TalkToEarnManager", MANAGER_ADDR);

  // 模拟一个 Content ID
  const contentIdStr = "test-content-" + Date.now();
  const contentId = ethers.keccak256(ethers.toUtf8Bytes(contentIdStr));
  console.log(`🧪 准备对内容 ID 进行质押: ${contentId}`);

  // 1. 授权 (Approve)
  console.log("\n🔓 正在授权 Manager 合约扣款...");
  const txApprove = await zrc20.approve(MANAGER_ADDR, stakeAmount);
  await txApprove.wait();
  console.log("   ✅ 授权成功");

  // 2. 质押 (Stake)
  console.log("\n🥩 正在执行质押...");
  const txStake = await manager.stake(contentId, ZRC20_BNB_ADDR, stakeAmount);
  console.log(`   Tx Hash: ${txStake.hash}`);
  await txStake.wait();
  console.log("   ✅ 质押成功");

  // 3. 验证 (Verify)
  console.log("\n🔍 验证链上数据...");
  const stakeInfo = await manager.stakes(contentId, ZRC20_BNB_ADDR, signer.address);
  // 注意：stakes 返回的是 struct，通常第一个字段是 amount
  const stakedAmount = stakeInfo[0]; 
  
  console.log(`   合约记录的质押量: ${ethers.formatUnits(stakedAmount, 18)}`);
  
  if (stakedAmount == stakeAmount) {
      console.log("🎉 测试完美通过！");
  } else {
      console.error("❌ 数据不匹配！");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
