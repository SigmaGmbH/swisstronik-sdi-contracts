import { ethers } from "hardhat";
import { readContractData } from "../utils";

async function main() {
  const [signer] = await ethers.getSigners();

  const SWTRProxy = await ethers.getContractAt(
    "SWTRProxy",
    "0xBF896E5616d12fE6Bd7a376D2DBb924ff531CFDF" // proxy address
  );

  const proxyAdmin = await ethers.getContractAt(
    "ProxyAdmin",
    "0x96e3ba5a33d21f64E5504Fd964656d1535a87F7e" // proxy admin address
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
