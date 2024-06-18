import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";

dotenv.config()

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    devnet: {
      url: "http://148.113.17.32:8545",
      accounts: [`0x` + `${process.env.PRIVATE_KEY}`],
    },
    testnet: {
      url: "https://json-rpc.testnet.swisstronik.com",
      accounts: [`0x` + `${process.env.PRIVATE_KEY}`],
    },
  },
  etherscan: {
    apiKey: `ANY_STRING_WILL_DO`,
    customChains: [
      {
        network: "devnet",
        chainId: 1291,
        urls: {
          apiURL: "https://explorer-evm.testnet.swisstronik.com/api",
          browserURL: "https://explorer-evm.testnet.swisstronik.com",
        },
      },
    ],
  },
};

export default config;
