import { ethers } from "hardhat";

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Deploying SWTRImplementation with the account:", signer.address);

  const SWTRImplementation = await ethers.deployContract("SWTRImplementation");
  await SWTRImplementation.waitForDeployment();
  console.log(`SWTRImplementation deployed to ${SWTRImplementation.target}`);

  const ProxyAdmin = await ethers.deployContract("ProxyAdmin", [signer.address]);
  await ProxyAdmin.waitForDeployment();
  console.log(`ProxyAdmin deployed to ${ProxyAdmin.target}`);

  const SWTRProxy = await ethers.deployContract("SWTRProxy", [
    SWTRImplementation.target, // implementation address
    ProxyAdmin.target, // admin address
    SWTRImplementation.interface.encodeFunctionData("initialize", [signer.address]), // data
  ]);
  await SWTRProxy.waitForDeployment();
  console.log(`SWTRProxy deployed to ${SWTRProxy.target}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
