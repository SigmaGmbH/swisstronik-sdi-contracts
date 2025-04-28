import { ethers } from "hardhat";
import { sendShieldedTransaction } from "../utils";
import { TransactionResponse } from "ethers";

async function main() {
  const [signer] = await ethers.getSigners();
  const SWTRProxy = await ethers.getContractAt(
    "SWTRProxy",
    "0xb4646662b94F94DdbfCCa75f1b57602E1C8A28F1" // proxy address
  );

  const SWTRImplementation = await ethers.deployContract("SWTRImplementation");
  await SWTRImplementation.waitForDeployment();
  console.log(`SWTRImplementation deployed to ${SWTRImplementation.target}`);

  const proxyAdmin = await ethers.getContractAt(
    "ProxyAdmin",
    "0xB0da35bA30f6e2D03C40f4710090ce353E7eda57"
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
