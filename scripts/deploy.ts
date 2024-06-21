import { ethers } from "hardhat";
import { readContractData } from "../utils";

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Deploying SWTRImplementation with the account:", signer.address);

  const SWTRImplementation = await ethers.deployContract("SWTRImplementation");
  await SWTRImplementation.waitForDeployment();
  console.log(`SWTRImplementation deployed to ${SWTRImplementation.target}`);

  const SWTRProxy = await ethers.deployContract("SWTRProxy", [
    SWTRImplementation.target,
    SWTRImplementation.interface.encodeFunctionData("initialize"),
  ]);
  await SWTRProxy.waitForDeployment();
  console.log(`SWTRProxy deployed to ${SWTRProxy.target}`);

  const proxyAdmin = await readContractData(signer.provider, SWTRProxy, "proxyAdmin");

  console.log("Proxy Admin:", proxyAdmin);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
