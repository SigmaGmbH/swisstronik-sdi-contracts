import { expect } from "chai";
import { ethers } from "hardhat";
import { SWTRImplementation } from "../typechain-types";
import { Signer } from "ethers";

describe("SWTRImplementation", () => {
  let contract: SWTRImplementation;
  let owner: Signer;
  let nonOwner: Signer;
  let addr1: string;
  let addr2: string;

  before(async () => {
    [owner, nonOwner] = await ethers.getSigners();
    addr1 = await nonOwner.getAddress();
    addr2 = ethers.Wallet.createRandom().address;
  });

  beforeEach(async () => {
    const Factory = await ethers.getContractFactory("SWTRImplementation");
    contract = await Factory.deploy();
    await contract.initialize(await owner.getAddress());
  });

  describe("addIssuersRecord", () => {
    it("Should allow owner to add issuer records", async () => {
      const tx = await contract.connect(owner).addIssuersRecord(
        ["Issuer1"],
        [1],
        [addr1]
      );


      const issuer = await contract.getIssuerRecordByAddress(addr1);
      expect(issuer.name).to.equal("Issuer1");
      expect(issuer.version).to.equal(1);
      expect(issuer.issuerAddress).to.equal(addr1);
    });

    it("Should prevent non-owners from adding issuers", async () => {
      await expect(
        contract.connect(nonOwner).addIssuersRecord(["Test"], [1], [addr1])
      ).to.be.revertedWithCustomError(
        contract,
        "OwnableUnauthorizedAccount"
      ).withArgs(await nonOwner.getAddress())
    });

    it("Should enforce array length equality", async () => {
      await expect(
        contract.connect(owner).addIssuersRecord(
          ["Name1", "Name2"],  // 2 names
          [1],                 // 1 version
          [addr1]              // 1 address
        )
      ).to.be.revertedWith("Length mismatch");
    });

    it("Should prevent zero addresses", async () => {
      await expect(
        contract.connect(owner).addIssuersRecord(
          ["ZeroAddress"],
          [1],
          [ethers.ZeroAddress]
        )
      ).to.be.revertedWith("Issuer has zero address");
    });

    it("Should prevent duplicate addresses", async () => {
      await contract.connect(owner).addIssuersRecord(
        ["Issuer1"],
        [1],
        [addr1]
      );

      await expect(
        contract.connect(owner).addIssuersRecord(
          ["Issuer2"],
          [1],
          [addr1]  // Same address
        )
      ).to.be.revertedWith("Issuer already exists");
    });

    it("Should prevent duplicate name+version pairs", async () => {
      await contract.connect(owner).addIssuersRecord(
        ["Duplicate"],
        [1],
        [addr1]
      );

      await expect(
        contract.connect(owner).addIssuersRecord(
          ["Duplicate"],
          [1],      // Same name+version
          [addr2]
        )
      ).to.be.revertedWith("Name+version already exists");
    });

    it("Should handle multiple issuers in one call", async () => {
      const names = ["Issuer1", "Issuer2"];
      const versions = [1, 2];
      const addresses = [addr1, addr2];

      await contract.connect(owner).addIssuersRecord(names, versions, addresses);

      expect(await contract.issuerRecordCount()).to.equal(2);

      const issuer1 = await contract.getIssuerRecordByAddress(addr1);
      expect(issuer1.name).to.equal("Issuer1");

      const issuer2 = await contract.getIssuerRecordByAddress(addr2);
      expect(issuer2.name).to.equal("Issuer2");
    });

    it("Should update all mappings correctly", async () => {
      await contract.connect(owner).addIssuersRecord(
        ["MappedIssuer"],
        [3],
        [addr1]
      );

      // Check issuerByAddress mapping
      const byAddress = await contract.issuerByAddress(addr1);
      expect(byAddress.name).to.equal("MappedIssuer");

      // Check issuerAddressByNameAndVersion mapping
      const byNameVersion = await contract.issuerAddressByNameAndVersion("MappedIssuer", 3);
      expect(byNameVersion).to.equal(addr1);

      // Check issuer index
      const index = await contract.issuerIndex(addr1);
      expect(index).to.equal(0);
    });
  });
});
