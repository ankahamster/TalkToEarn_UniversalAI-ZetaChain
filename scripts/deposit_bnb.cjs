const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("🚀 开始充值 BNB (BSC -> ZetaChain)...");
  console.log("   账户:", signer.address);

  // 1. BSC Testnet 的 Gateway 合约地址 (ZetaChain V2 标准入口)
  // 这是你之前在 src/lib/zetachain.ts 里确认过的地址
  const GATEWAY_BSC = "0xe6133c954388337777209778c772fb919280438d";

  // 2. 连接 Gateway 合约
  // 我们只需要 'deposit' 函数
  const abi = [
    "function deposit(address receiver) external payable"
  ];
  const gateway = new ethers.Contract(GATEWAY_BSC, abi, signer);

  // 3. 准备充值金额 (例如 0.05 BNB)
  const depositAmount = ethers.parseEther("0.05");

  // 4. 发起充值交易
  console.log(`\n💸 正在向 Gateway 存入 ${ethers.formatEther(depositAmount)} BNB...`);
  try {
    // 调用 deposit，接收者填你自己的地址
    // 注意：这笔交易是在 'bsc_testnet' 上发起的
    const tx = await gateway.deposit(signer.address, {
      value: depositAmount
    });
    
    console.log("   Tx Hash:", tx.hash);
    process.stdout.write("   等待交易上链...");
    await tx.wait();
    console.log("\n✅ 充值交易已在 BSC 确认!");
    console.log("⏳ 请等待约 1-3 分钟，让 ZetaChain 监测并铸造 ZRC20-BNB...");

  } catch (error) {
    console.error("\n❌ 充值失败:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});