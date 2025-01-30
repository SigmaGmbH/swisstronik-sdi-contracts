import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("SWTRImplementation Array Removal", function () {
  // We define a fixture to reuse the same setup in multiple tests
  async function deploySWTRFixture() {
    const [owner, addr1, addr2, addr3] = await ethers.getSigners();

    const SWTRImplementation = await ethers.getContractFactory("SWTRImplementation");
    const swtr = await SWTRImplementation.deploy();
    await swtr.initialize(owner.address);

    // Test data for three issuers
    const names = ["IssuerA", "IssuerB", "IssuerC"];
    const versions = [1, 1, 1];
    const addresses = [addr1.address, addr2.address, addr3.address];

    return { swtr, owner, addr1, addr2, addr3, names, versions, addresses };
  }

  describe("removeIssuerRecord", function () {
    it("Should properly handle indices when removing middle element", async function () {
      const { swtr, names, versions, addresses } = await loadFixture(deploySWTRFixture);

      // Add all three issuers
      await swtr.addIssuersRecord(names, versions, addresses);

      // Check initial state
      expect(await swtr.issuerRecordCount()).to.equal(3);

      // Remove middle issuer (IssuerB)
      await swtr.removeIssuerRecord("IssuerB", 1);

      // Check array length decreased
      expect(await swtr.issuerRecordCount()).to.equal(2);

      // This will fail due to the bug - issuerIndex for IssuerC is not updated
      const lastIssuer = await swtr.issuers(1); // Should be IssuerC
      expect(lastIssuer.name).to.equal("IssuerC");

      // Verify IssuerB is completely removed
      const removedIssuer = await swtr.issuerByAddress(addresses[1]);
      expect(removedIssuer.issuerAddress).to.equal(ethers.ZeroAddress);
    });

    it("Should handle removing the last element correctly", async function () {
      const { swtr, names, versions, addresses } = await loadFixture(deploySWTRFixture);

      // Add all three issuers
      await swtr.addIssuersRecord(names, versions, addresses);

      // Remove last issuer (IssuerC)
      await swtr.removeIssuerRecord("IssuerC", 1);

      // Check array length
      expect(await swtr.issuerRecordCount()).to.equal(2);

      // First two issuers should remain unchanged
      const firstIssuer = await swtr.issuers(0);
      expect(firstIssuer.name).to.equal("IssuerA");

      const secondIssuer = await swtr.issuers(1);
      expect(secondIssuer.name).to.equal("IssuerB");
    });

    it("Should revert when trying to remove a non-existent issuer", async function () {
      const { swtr } = await loadFixture(deploySWTRFixture);

      await expect(
        swtr.removeIssuerRecord("NonExistentIssuer", 1)
      ).to.be.revertedWith("Issuer does not exist");
    });

    it("Should maintain correct indices for remaining issuers after multiple removals", async function () {
      const { swtr, names, versions, addresses } = await loadFixture(deploySWTRFixture);

      // Add all three issuers
      await swtr.addIssuersRecord(names, versions, addresses);

      // Remove middle issuer (IssuerB)
      await swtr.removeIssuerRecord("IssuerB", 1);

      // Try to add IssuerB again - should work if indices are correct
      await swtr.addIssuersRecord(
        ["IssuerB"],
        [2],
        [addresses[1]]
      );

      // Verify final state
      expect(await swtr.issuerRecordCount()).to.equal(3);

      const lastIssuer = await swtr.issuers(2);
      expect(lastIssuer.name).to.equal("IssuerB");
      expect(lastIssuer.version).to.equal(2);
    });

    it("Should clear all mappings after removal", async function () {
      const { swtr, names, versions, addresses } = await loadFixture(deploySWTRFixture);

      // Add issuers
      await swtr.addIssuersRecord(names, versions, addresses);

      // Remove middle issuer
      await swtr.removeIssuerRecord("IssuerB", 1);

      // Check all related mappings are cleared
      const removedIssuerByAddress = await swtr.issuerByAddress(addresses[1]);
      expect(removedIssuerByAddress.issuerAddress).to.equal(ethers.ZeroAddress);

      const removedIssuerAddress = await swtr.issuerAddressByNameAndVersion("IssuerB", 1);
      expect(removedIssuerAddress).to.equal(ethers.ZeroAddress);
    });
  });
});
