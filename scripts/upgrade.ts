import { ethers } from "hardhat";
import { readContractData, sendShieldedTransaction } from "../utils";
import { TransactionResponse } from "ethers";

async function main() {
  const [signer] = await ethers.getSigners();
  const SWTRProxy = await ethers.getContractAt(
    "SWTRProxy",
    "0xC271c016cBdbbe19e5505a79aAD73e40F4654B3e"
  );

  const proxyAdmin = (
    await readContractData(signer.provider, SWTRProxy, "proxyAdmin")
  )[0];
  console.log("Proxy Admin:", proxyAdmin);

  const SWTRImplementation = await ethers.deployContract("SWTRImplementation");
  await SWTRImplementation.waitForDeployment();
  console.log(`SWTRImplementation deployed to ${SWTRImplementation.target}`);

  const proxyAdminContract = await ethers.getContractAt(
    "ProxyAdmin",
    proxyAdmin
  );

  let tx: TransactionResponse = await sendShieldedTransaction(
    signer,
    proxyAdminContract.target as string,
    proxyAdminContract.interface.encodeFunctionData("upgradeAndCall", [
      SWTRProxy.target as string,
      SWTRImplementation.target as string,
      "0x",
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
