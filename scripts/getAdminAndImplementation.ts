import { ethers } from "hardhat";
import { readContractData } from "../utils";

async function main() {
  const [signer] = await ethers.getSigners();

  const SWTRProxy = await ethers.getContractAt(
    "SWTRProxy",
    "0xb4646662b94F94DdbfCCa75f1b57602E1C8A28F1" // proxy address
  );

  const proxyAdmin = await ethers.getContractAt(
    "ProxyAdmin",
    "0xB0da35bA30f6e2D03C40f4710090ce353E7eda57" // proxy admin address
  );

  const implementation = (
    await readContractData(signer.provider, proxyAdmin, "implementation", [
      SWTRProxy.target,
    ])
  )[0];
  console.log("Current implementation:", implementation);

  const admin = (
    await readContractData(signer.provider, proxyAdmin, "admin", [
      SWTRProxy.target,
    ])
  )[0];
  console.log("Current admin:", admin);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
