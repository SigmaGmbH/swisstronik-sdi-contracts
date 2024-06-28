import { ethers } from "hardhat";
import { readContractData } from "../utils";

async function main() {
  const [signer] = await ethers.getSigners();

  const SWTRProxy = await ethers.getContractAt(
    "SWTRProxy",
    "0xa7175e81b761793C848FEFE107E0F2475F50D57E" // proxy address
  );

  const proxyAdmin = await ethers.getContractAt(
    "ProxyAdmin",
    "0x1E317f9BD7f26e19Dd61a001B81C53c10948DC0D" // proxy admin address
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
