// scripts/check_nft_balance.cjs
const hre = require("hardhat");

async function main() {
  // ================= 配置区 =================
  // 你的 NFT 合约地址 (之前部署的)
  const NFT_ADDRESS = "0xD57e7144BEa29900A201BB88DC1D88F37D3Ad649";
  
  // 你的钱包地址
  const USER_ADDRESS = "0xf33d6e8180D7A86EBe60DaeB5b6AAe96aB0f3483";
  // ==========================================

  console.log("🔍 正在直接查询链上数据...");
  console.log(`Target Contract: ${NFT_ADDRESS}`);
  console.log(`Target User:     ${USER_ADDRESS}`);

  // 连接到合约
  // 注意：这里我们不需要完整的 ABI，只需要我们要查的函数即可，这样更通用
  const abi = [
    "function balanceOf(address owner) view returns (uint256)",
    "function name() view returns (string)",
    "function symbol() view returns (string)"
  ];

  const provider = hre.ethers.provider;
  const nftContract = new hre.ethers.Contract(NFT_ADDRESS, abi, provider);

  try {
    // 1. 验证合约是否存在
    const code = await provider.getCode(NFT_ADDRESS);
    if (code === "0x") {
      console.error("❌ 错误: 该地址没有合约代码！请检查地址是否正确。");
      return;
    }

    // 2. 获取基本信息
    const name = await nftContract.name();
    const symbol = await nftContract.symbol();
    console.log(`✅ 合约连接成功: ${name} (${symbol})`);

    // 3. 查询余额 (这是最关键的一步)
    const balance = await nftContract.balanceOf(USER_ADDRESS);
    
    console.log("---------------------------------------------------");
    console.log(`🎉 当前 NFT 余额: [ ${balance.toString()} ] 枚`);
    console.log("---------------------------------------------------");

    if (balance > 0n) {
      console.log("✨ 恭喜！跨链调用成功，你的钱包里已经有勋章了！");
      console.log("   (浏览器没显示是因为索引延迟，不要担心)");
    } else {
      console.log("⏳ 余额仍为 0。可能原因：");
      console.log("   1. 跨链还在处理中 (ZetaChain 通常需要 2-5 分钟)");
      console.log("   2. 跨链调用因 Gas 不足在目标链 Revert 了");
    }

  } catch (error) {
    console.error("❌ 查询失败:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
