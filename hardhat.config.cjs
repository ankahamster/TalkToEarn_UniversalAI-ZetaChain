require("@nomicfoundation/hardhat-toolbox");
require("@zetachain/toolkit/tasks");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.26", // 确保这里是 0.8.26
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    zeta_testnet: {
      // 默认使用 BlockPI 节点；如需切换可再设置 ZETA_RPC_URL 覆盖
      url: process.env.ZETA_RPC_URL || "https://zetachain-athens-evm.blockpi.network/v1/rpc/public",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 7001,
    },
    // 👇 新增：BSC Testnet 配置
    bsc_testnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 97,
    },
    hardhat: {
      chainId: 1337,
    },
  },
};
