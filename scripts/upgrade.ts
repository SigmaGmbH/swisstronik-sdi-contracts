import { ethers } from "hardhat";
import { sendShieldedTransaction } from "../utils";
import { TransactionResponse } from "ethers";

async function main() {
  const [signer] = await ethers.getSigners();
  const SWTRProxy = await ethers.getContractAt(
    "SWTRProxy",
    "0xE6864d7873b99b115C19071D6cFC711fDa69c010"
  );

  const SWTRImplementation = await ethers.deployContract("SWTRImplementation");
  await SWTRImplementation.waitForDeployment();
  console.log(`SWTRImplementation deployed to ${SWTRImplementation.target}`);

  const proxyAdmin = await ethers.getContractAt(
    "ProxyAdmin",
    "0x7D50B404b2e05fD2ef408c81690ECf532Be7DCC3"
  );

  let tx: TransactionResponse = await sendShieldedTransaction(
    signer,
    proxyAdmin.target as string,
    proxyAdmin.interface.encodeFunctionData("upgradeToAndCall", [
      SWTRProxy.target as string, //proxy address
      SWTRImplementation.target as string, // implementation address
      "0x", // data
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
