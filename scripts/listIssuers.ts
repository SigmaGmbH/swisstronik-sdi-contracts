import { ethers } from "hardhat";
import { readContractData } from "../utils";

async function main() {
  const [signer] = await ethers.getSigners();
  const contract = await ethers.getContractAt(
    "SWTRImplementation",
    "0xE6864d7873b99b115C19071D6cFC711fDa69c010" // proxy address
  );

  const issuerCount = (await readContractData(
    signer.provider,
    contract,
    "issuerRecordCount"
  ))[0];

  console.log("Issuer Count:", issuerCount);

  if (issuerCount === 0n) return;

  const issuers = await readContractData(
    signer.provider,
    contract,
    "listIssuersRecord",
    [0, issuerCount]
  );

  console.log("Issuers:", issuers);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
