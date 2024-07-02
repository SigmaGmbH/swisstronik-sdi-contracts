import { ethers } from "hardhat";
import { sendShieldedTransaction } from "../utils";
import { TransactionResponse } from "ethers";

async function main() {
  const [signer] = await ethers.getSigners();
  const SWTRProxy = await ethers.getContractAt(
    "SWTRProxy",
    "0xBF896E5616d12fE6Bd7a376D2DBb924ff531CFDF" // proxy address
  );

  const SWTRImplementation = await ethers.deployContract("SWTRImplementation");
  await SWTRImplementation.waitForDeployment();
  console.log(`SWTRImplementation deployed to ${SWTRImplementation.target}`);

  const proxyAdmin = await ethers.getContractAt(
    "ProxyAdmin",
    "0x96e3ba5a33d21f64E5504Fd964656d1535a87F7e"
  );

  let tx: TransactionResponse = await sendShieldedTransaction(
    signer,
    proxyAdmin.target as string,
    proxyAdmin.interface.encodeFunctionData("upgradeTo", [
      SWTRProxy.target as string, //proxy address
      SWTRImplementation.target as string, // implementation address
    ]),
    "0"
  );

  await tx.wait();
  console.log("Contract upgraded successfully!");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
