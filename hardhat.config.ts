import {HardhatUserConfig, task} from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import '@openzeppelin/hardhat-upgrades';
import dotenv from "dotenv";
import 'solidity-coverage';

dotenv.config()


task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const ethers = hre.ethers;
  const accounts= await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
    console.log(ethers.formatEther(await ethers.provider.getBalance(account.address)));
  }
});

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    testnet: {
      url: "https://json-rpc.testnet.swisstronik.com",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    mainnet: {
      url: "https://json-rpc.mainnet.swisstronik.com",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: `ANY_STRING_WILL_DO`,
    customChains: [
      {
        network: "testnet",
        chainId: 1291,
        urls: {
          apiURL: "https://explorer-evm.testnet.swisstronik.com/api",
          browserURL: "https://explorer-evm.testnet.swisstronik.com",
        },
      },
      {
        network: "mainnet",
        chainId: 1848,
        urls: {
          apiURL: "https://explorer-evm.mainnet.swisstronik.com/api",
          browserURL: "https://explorer-evm.mainnet.swisstronik.com",
        },
      },
    ],
  },
};

export default config;
