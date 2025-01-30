import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("SWTRImplementation CompilotV1 Decoder", function () {
  async function deploySWTRFixture() {
    const [owner] = await ethers.getSigners();
    const SWTR = await ethers.getContractFactory("SWTRImplementation");
    const swtr = await SWTR.deploy();
    await swtr.initialize(owner.address);
    return { swtr, owner };
  }

  describe("decodeCompilotV1OriginalData", function () {
    it("Should correctly decode CompilotV1 data", async function () {
      const { swtr } = await loadFixture(deploySWTRFixture);

      // This is the proofData from your example
      const proofData = "0x000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000678a0f3100000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000007556e6b6e6f776e0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000064163746976650000000000000000000000000000000000000000000000000000";

      const [riskScore, createdAt, status] = await swtr.decodeCompilotV1OriginalData(proofData);

      // Verify decoded values
      expect(riskScore).to.equal("Unknown");
      expect(Number(createdAt)).to.equal(0x678a0f31); // Unix timestamp
      expect(status).to.equal("Active");
    });

    it("Should handle empty values correctly", async function () {
      const { swtr } = await loadFixture(deploySWTRFixture);

      // Create encoded data with empty strings
      const emptyData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["string", "uint32", "string"],
        ["", 0, ""]
      );

      const [riskScore, createdAt, status] = await swtr.decodeCompilotV1OriginalData(emptyData);

      expect(riskScore).to.equal("");
      expect(Number(createdAt)).to.equal(0);
      expect(status).to.equal("");
    });

    it("Should revert on malformed data", async function () {
      const { swtr } = await loadFixture(deploySWTRFixture);

      // Create incorrectly formatted data
      const malformedData = "0x1234";

      await expect(
        swtr.decodeCompilotV1OriginalData(malformedData)
      ).to.be.reverted;
    });

    it("Should correctly encode and decode data round-trip", async function () {
      const { swtr } = await loadFixture(deploySWTRFixture);

      // Test data
      const testData = {
        riskScore: "High",
        createdAt: 1673431729, // Some unix timestamp
        status: "Pending"
      };

      // Encode the test data
      const encodedData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["string", "uint32", "string"],
        [testData.riskScore, testData.createdAt, testData.status]
      );

      // Decode it using the contract function
      const [riskScore, createdAt, status] = await swtr.decodeCompilotV1OriginalData(encodedData);

      // Verify round-trip
      expect(riskScore).to.equal(testData.riskScore);
      expect(Number(createdAt)).to.equal(testData.createdAt);
      expect(status).to.equal(testData.status);
    });
  });
});
