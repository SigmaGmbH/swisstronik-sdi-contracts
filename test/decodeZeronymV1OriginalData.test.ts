import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("SWTRImplementation ZeronymV1 Decoder", function () {
  async function deploySWTRFixture() {
    const [owner] = await ethers.getSigners();
    const SWTR = await ethers.getContractFactory("SWTRImplementation");
    const swtr = await SWTR.deploy();
    await swtr.initialize(owner.address);
    return { swtr, owner };
  }

  describe("decodeZeronymV1OriginalData", function () {
    it("Should correctly decode ZeronymV1 data", async function () {
      const { swtr } = await loadFixture(deploySWTRFixture);

      // Sample encoded data from your example:
      // - bool: false
      // - actionId: 0x075bcd15 (123456789 in decimal)
      // - output1: 0x40b8810cbaed9647b54d18cc98b720e1e8876be5d8e7089d3c079fc61c30a4
      // - output2: 0x0f8d1ac008494e35bece45fbf081dde78384d81828cb86d8073ce7aa8e4e52a5
      const sampleData = "0x0000000000000000000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000000000075bcd15" +
        "0040b8810cbaed9647b54d18cc98b720e1e8876be5d8e7089d3c079fc61c30a4" +
        "0f8d1ac008494e35bece45fbf081dde78384d81828cb86d8073ce7aa8e4e52a5";

      const [isFromUs, actionId, output1, output2] =
        await swtr.decodeZeronymV1OriginalData(sampleData);

      expect(isFromUs).to.equal(false);
      expect(actionId).to.equal(123456789);
      expect(output1).to.equal("0x40b8810cbaed9647b54d18cc98b720e1e8876be5d8e7089d3c079fc61c30a4");
      expect(output2).to.equal("0x0f8d1ac008494e35bece45fbf081dde78384d81828cb86d8073ce7aa8e4e52a5");
    });

    it("Should revert on malformed data", async function () {
      const { swtr } = await loadFixture(deploySWTRFixture);

      // Passing data that is too short (i.e. not exactly 4 * 32 bytes)
      const malformedData = "0x1234";

      await expect(
        swtr.decodeZeronymV1OriginalData(malformedData)
      ).to.be.reverted;
    });

    it("Should correctly encode and decode data round-trip", async function () {
      const { swtr } = await loadFixture(deploySWTRFixture);

      const testData = {
        isFromUs: true,
        actionId: 987654321,
        output1: "0x1111111111111111111111111111111111111111111111111111111111111111",
        output2: "0x2222222222222222222222222222222222222222222222222222222222222222"
      };

      // Encode the test data using ethers' ABI coder
      const encodedData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["bool", "uint256", "uint256", "uint256"],
        [testData.isFromUs, testData.actionId, testData.output1, testData.output2]
      );

      // Decode it using the contract function
      const [decodedIsFromUs, decodedActionId, decodedOutput1, decodedOutput2] =
        await swtr.decodeZeronymV1OriginalData(encodedData);

      expect(decodedIsFromUs).to.equal(testData.isFromUs);
      expect(decodedActionId).to.equal(testData.actionId);
      expect(decodedOutput1).to.equal(testData.output1);
      expect(decodedOutput2).to.equal(testData.output2);
    });
  });
});
