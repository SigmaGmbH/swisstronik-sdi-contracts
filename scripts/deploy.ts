import { ethers } from "hardhat";

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Deploying SWTRImplementation with the account:", signer.address);

  const SWTRImplementation = await ethers.deployContract("SWTRImplementation");
  await SWTRImplementation.waitForDeployment();
  console.log(`SWTRImplementation adapter deployed to ${SWTRImplementation.target}`);

  const SWTRProxy = await ethers.deployContract("SWTRProxy", [SWTRImplementation.target]);
  await SWTRProxy.waitForDeployment();
  console.log(`SWTRProxy adapter deployed to ${SWTRProxy.target}`);

  console.log("Proxy Admin:", await SWTRProxy.proxyAdmin());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
