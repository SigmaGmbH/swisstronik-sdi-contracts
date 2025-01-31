import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

const BRIDGE_ADDRESS = "0x0000000000000000000000000000000000000404";


describe("SWTRImplementation User Verification", function () {
  // Test fixture
  async function deployVerificationFixture() {
    const [owner, user1, issuer1, issuer2] = await ethers.getSigners();

    // Deploy mock bridge first
    const MockBridge = await ethers.getContractFactory("MockComplianceBridge");
    const mockBridge = await MockBridge.deploy();

    // Get the code from mock bridge
    const mockBridgeCode = await ethers.provider.getCode(mockBridge.target);

    // Set code at address 1028
    await ethers.provider.send("hardhat_setCode", [
      BRIDGE_ADDRESS,  // Address 1028 in hex
      mockBridgeCode
    ]);

    // Now we can interact with the mock at address 1028
    const mockAt1028 = MockBridge.attach(BRIDGE_ADDRESS) as any;

    // Deploy SWTR
    const SWTR = await ethers.getContractFactory("SWTRImplementation");
    const swtr = await SWTR.deploy();
    await swtr.initialize(owner.address);

    const verificationTypes = {
      VT_UNKNOWN: 0,
      VT_AML: 1,
      VT_HUMANITY: 2
    };

    return {
      swtr,
      mockBridge: mockAt1028,
      owner,
      user1,
      issuer1,
      issuer2,
      verificationTypes
    };
  }

  describe("isUserVerified", function () {
    it("Should return true when user is verified", async function () {
      const { swtr, mockBridge, user1, verificationTypes } = await loadFixture(deployVerificationFixture);

      // Set verification status in mock bridge
      await mockBridge.setVerificationStatus(user1.address, verificationTypes.VT_AML, true);

      // Check verification
      const isVerified = await swtr.isUserVerified(
        user1.address,
        0, // expiration timestamp
        verificationTypes.VT_AML
      );

      expect(isVerified).to.be.true;
    });

    it("Should return false when user is not verified", async function () {
      const { swtr, user1, verificationTypes } = await loadFixture(deployVerificationFixture);

      // Don't set any verification status - should return false
      const isVerified = await swtr.isUserVerified(
        user1.address,
        0,
        verificationTypes.VT_AML
      );

      expect(isVerified).to.be.false;
    });

    it("Should handle expired verifications", async function () {
      const { swtr, mockBridge, user1, verificationTypes } = await loadFixture(deployVerificationFixture);

      const currentTimestamp = Math.floor(Date.now() / 1000);
      await mockBridge.setVerificationStatus(user1.address, verificationTypes.VT_AML, true);

      // Check with future expiration
      const isVerifiedFuture = await swtr.isUserVerified(
        user1.address,
        currentTimestamp + 3600, // 1 hour in future
        verificationTypes.VT_AML
      );

      expect(isVerifiedFuture).to.be.true;
    });
  });

  describe("isUserVerifiedBy", function () {
    it("Should return true when user is verified by specific issuer", async function () {
      const { swtr, mockBridge, user1, issuer1, verificationTypes } = await loadFixture(deployVerificationFixture);

      // Set verification status for specific issuer
      await mockBridge.setIssuerVerificationStatus(user1.address, issuer1.address, true);

      const isVerified = await swtr.isUserVerifiedBy(
        user1.address,
        0,
        verificationTypes.VT_AML,
        [issuer1.address]
      );

      expect(isVerified).to.be.true;
    });

    it("Should return false when user is not verified by any allowed issuer", async function () {
      const { swtr, user1, issuer1, issuer2, verificationTypes } = await loadFixture(deployVerificationFixture);

      const isVerified = await swtr.isUserVerifiedBy(
        user1.address,
        0,
        verificationTypes.VT_AML,
        [issuer1.address, issuer2.address]
      );

      expect(isVerified).to.be.false;
    });

    it("Should handle multiple allowed issuers", async function () {
      const { swtr, mockBridge, user1, issuer1, issuer2, verificationTypes } = await loadFixture(deployVerificationFixture);

      // Set verification for second issuer only
      await mockBridge.setIssuerVerificationStatus(user1.address, issuer2.address, true);

      const isVerified = await swtr.isUserVerifiedBy(
        user1.address,
        0,
        verificationTypes.VT_AML,
        [issuer1.address, issuer2.address]
      );

      expect(isVerified).to.be.true;
    });

    it("Should handle empty allowed issuers array", async function () {
      const { swtr, user1, verificationTypes } = await loadFixture(deployVerificationFixture);

      const isVerified = await swtr.isUserVerifiedBy(
        user1.address,
        0,
        verificationTypes.VT_AML,
        []
      );

      expect(isVerified).to.be.false;
    });
  });
});
