import {expect} from "chai";
import {ethers} from "hardhat";
import {loadFixture} from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("SWTRImplementation Issuer Getters", function () {
  // Test fixture to deploy contract and set up test data
  async function deployWithIssuersFixture() {
    const [owner, addr1, addr2, addr3] = await ethers.getSigners();
    const SWTR = await ethers.getContractFactory("SWTRImplementation");
    const swtr = await SWTR.deploy();
    await swtr.initialize(owner.address);

    // Add some test issuers
    const names = ["Issuer1", "Issuer2", "Issuer3"];
    const versions = [1, 1, 2];
    const addresses = [addr1.address, addr2.address, addr3.address];

    await swtr.addIssuersRecord(names, versions, addresses);

    return {swtr, owner, addr1, addr2, addr3, names, versions};
  }

  describe("getIssuerRecordByAddress", function () {
    it("Should return correct issuer data for existing issuer", async function () {
      const {swtr, addr1} = await loadFixture(deployWithIssuersFixture);

      const issuer = await swtr.getIssuerRecordByAddress(addr1.address);
      expect(issuer.name).to.equal("Issuer1");
      expect(issuer.version).to.equal(1);
      expect(issuer.issuerAddress).to.equal(addr1.address);
    });

    it("Should return empty issuer for non-existent address", async function () {
      const {swtr} = await loadFixture(deployWithIssuersFixture);
      const randomAddr = ethers.Wallet.createRandom().address;

      const issuer = await swtr.getIssuerRecordByAddress(randomAddr);
      expect(issuer.issuerAddress).to.equal(ethers.ZeroAddress);
    });
  });

  describe("getIssuerAddressesByNameAndVersions", function () {
    it("Should return correct addresses for existing name and versions", async function () {
      const {swtr, addr1, addr3} = await loadFixture(deployWithIssuersFixture);

      const versions = [1, 2];
      const addresses = await swtr.getIssuerAddressesByNameAndVersions("Issuer1", versions);

      expect(addresses[0]).to.equal(addr1.address); // Version 1
      expect(addresses[1]).to.equal(ethers.ZeroAddress); // Version 2 doesn't exist
    });

    it("Should return zero addresses for non-existent name", async function () {
      const {swtr} = await loadFixture(deployWithIssuersFixture);

      const versions = [1];
      const addresses = await swtr.getIssuerAddressesByNameAndVersions("NonExistentIssuer", versions);

      expect(addresses[0]).to.equal(ethers.ZeroAddress);
    });
  });

  describe("listIssuersRecord", function () {
    it("Should return correct slice of issuers array", async function () {
      const {swtr, addr1, addr2} = await loadFixture(deployWithIssuersFixture);

      const issuers = await swtr.listIssuersRecord(0, 2);
      expect(issuers.length).to.equal(2);
      expect(issuers[0].name).to.equal("Issuer1");
      expect(issuers[1].name).to.equal("Issuer2");
    });

    it("Should revert when range is invalid", async function () {
      const {swtr} = await loadFixture(deployWithIssuersFixture);

      await expect(swtr.listIssuersRecord(2, 1)).to.be.revertedWith("Invalid range");
      await expect(swtr.listIssuersRecord(0, 4)).to.be.revertedWith("Invalid range");
    });
  });

  describe("issuerRecordCount", function () {
    it("Should return correct number of issuers", async function () {
      const {swtr} = await loadFixture(deployWithIssuersFixture);

      const count = await swtr.issuerRecordCount();
      expect(count).to.equal(3);
    });

    it("Should update after adding new issuers", async function () {
      const {swtr} = await loadFixture(deployWithIssuersFixture);

      const newIssuer = ethers.Wallet.createRandom().address;
      await swtr.addIssuersRecord(["NewIssuer"], [1], [newIssuer]);

      const count = await swtr.issuerRecordCount();
      expect(count).to.equal(4);
    });
  });
});
