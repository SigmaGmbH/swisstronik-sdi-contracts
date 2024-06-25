import { ethers } from "hardhat";
import { sendShieldedTransaction } from "../utils";
import { TransactionResponse } from "ethers";

async function main() {
  const [signer] = await ethers.getSigners();
  const SWTRProxy = await ethers.getContractAt(
    "SWTRProxy",
    "0xa7175e81b761793C848FEFE107E0F2475F50D57E"
  );

  const SWTRImplementation = await ethers.deployContract("SWTRImplementation");
  await SWTRImplementation.waitForDeployment();
  console.log(`SWTRImplementation deployed to ${SWTRImplementation.target}`);

  const proxyAdmin = await ethers.getContractAt(
    "ProxyAdmin",
    "0x1E317f9BD7f26e19Dd61a001B81C53c10948DC0D"
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
