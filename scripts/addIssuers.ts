import { ethers } from "hardhat";
import { sendShieldedTransaction } from "../utils";
import { TransactionResponse } from "ethers";

async function main() {
  const [signer] = await ethers.getSigners();
  const contract = await ethers.getContractAt(
    "SWTRImplementation",
    "0xBF896E5616d12fE6Bd7a376D2DBb924ff531CFDF" // proxy address
  );

  console.log("Adding new records...");

  const issuersToAdd = [
    {
      name: "Quadrata",
      version: 1,
      address: "0x971CD375a8799ca7F2366104e117C5497243C478",
    },
    {
      name: "Worldcoin",
      version: 1,
      address: "0x5563712d4923E3220cF94D53dD2f9765969dBac3",
    },
  ];

  let tx: TransactionResponse = await sendShieldedTransaction(
    signer,
    contract.target as string,
    contract.interface.encodeFunctionData("addIssuersRecord", [
      issuersToAdd.map((issuer) => issuer.name),
      issuersToAdd.map((issuer) => issuer.version),
      issuersToAdd.map((issuer) => issuer.address),
    ]),
    "0"
  );

  await tx.wait();

  console.log("Issuers added successfully!");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
