import { ethers } from "hardhat";
import { readContractData } from "../utils";

async function main() {
  const [signer] = await ethers.getSigners();

  const SWTRProxy = await ethers.getContractAt(
    "SWTRProxy",
    "0x7a838b0545513aC19920128Fdc8ECd25C9b1b1bD" // proxy address
  );

  const proxyAdmin = await ethers.getContractAt(
    "ProxyAdmin",
    "0xe49de5cAC6aa19E70499D89D04E475a7CcDC58C1" // proxy admin address
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
