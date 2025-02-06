import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

const BRIDGE_ADDRESS = "0x0000000000000000000000000000000000000404";


const verificationTypes = {
  VT_UNSPECIFIED: 0,
  VT_AML: 5,
  VT_HUMANITY: 4,
  VT_KYC: 1
};

describe("BaseIssuerAdapter", function () {
  async function deployAdapterFixture() {
    const [owner, user1, user2] = await ethers.getSigners();

    // Deploy mock bridge first
    const MockBridge = await ethers.getContractFactory("MockComplianceBridge");
    const mockBridge = await MockBridge.deploy();

    // Get the code from mock bridge
    const mockBridgeCode = await ethers.provider.getCode(mockBridge.target);

    // Set code at bridge address
    await ethers.provider.send("hardhat_setCode", [
      BRIDGE_ADDRESS,
      mockBridgeCode
    ]);

    // Now we can interact with the mock at the bridge address
    const mockAt1028 = MockBridge.attach(BRIDGE_ADDRESS) as any;

    // Deploy TestIssuerAdapter
    const TestAdapter = await ethers.getContractFactory("TestIssuerAdapter");
    const adapter = await TestAdapter.deploy();

    return {
      adapter,
      mockBridge: mockAt1028,
      owner,
      user1,
      user2
    };
  }

  describe("markAsVerified", function () {
    it("Should successfully mark a user as verified using V1", async function () {
      const { adapter, owner, user1 } = await loadFixture(deployAdapterFixture);

      const verificationParams = {
        userAddress: user1.address,
        id: "verification123",
        proofData: "0x1234",
        expirationTimestamp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        verificationType: verificationTypes.VT_KYC,
        publicKey: ethers.ZeroHash, // Use V1 by setting zero public key
        originChain: "ethereum",
        schema: "standard-kyc-v1",
        version: 1
      };

      const tx = await adapter.connect(owner).markAsVerified(verificationParams);
      const receipt = await tx.wait();

      // Check if UserVerified event was emitted
      const event = receipt?.logs.find(
        log => log.topics[0] === adapter.interface.getEvent("UserVerified")?.topicHash
      );
      expect(event).to.not.be.undefined;
    });

    it("Should successfully mark a user as verified using V2", async function () {
      const { adapter, owner, user1 } = await loadFixture(deployAdapterFixture);

      const verificationParams = {
        userAddress: user1.address,
        id: "verification123",
        proofData: "0x1234",
        expirationTimestamp: Math.floor(Date.now() / 1000) + 3600,
        verificationType: verificationTypes.VT_KYC,
        publicKey: ethers.keccak256("0x5678"), // Non-zero public key for V2
        originChain: "ethereum",
        schema: "standard-kyc-v2",
        version: 2
      };

      const tx = await adapter.connect(owner).markAsVerified(verificationParams);
      const receipt = await tx.wait();

      const event = receipt?.logs.find(
        log => log.topics[0] === adapter.interface.getEvent("UserVerified")?.topicHash
      );
      expect(event).to.not.be.undefined;
    });

    it("Should only allow owner to mark as verified", async function () {
      const { adapter, user1, user2 } = await loadFixture(deployAdapterFixture);

      const verificationParams = {
        userAddress: user2.address,
        id: "verification123",
        proofData: "0x1234",
        expirationTimestamp: Math.floor(Date.now() / 1000) + 3600,
        verificationType: verificationTypes.VT_KYC,
        publicKey: ethers.ZeroHash,
        originChain: "ethereum",
        schema: "standard-kyc-v1",
        version: 1
      };

      await expect(
        adapter.connect(user1).markAsVerified(verificationParams)
      ).to.be.revertedWithCustomError(adapter, "OwnableUnauthorizedAccount");
    });

    // it("Should fail if bridge call fails", async function () {
    //   const { adapter, owner, user1 } = await loadFixture(deployAdapterFixture);
    //
    //   // Use invalid verification type to trigger failure
    //   const verificationParams = {
    //     userAddress: user1.address,
    //     id: "verification123",
    //     proofData: "0x1234",
    //     expirationTimestamp: Math.floor(Date.now() / 1000) + 3600,
    //     verificationType: 0, // Invalid verification type
    //     publicKey: ethers.ZeroHash,
    //     originChain: "ethereum",
    //     schema: "standard-kyc-v1",
    //     version: 1
    //   };
    //
    //   await expect(
    //     adapter.connect(owner).markAsVerified(verificationParams)
    //   ).to.be.revertedWith("Verification failed");
    // });
  });

  describe("revokeVerification", function () {
    it("Should successfully revoke a verification", async function () {
      const { adapter, owner, user1 } = await loadFixture(deployAdapterFixture);

      // First mark as verified
      const verificationParams = {
        userAddress: user1.address,
        id: "verification123",
        proofData: "0x1234",
        expirationTimestamp: Math.floor(Date.now() / 1000) + 3600,
        verificationType: verificationTypes.VT_KYC,
        publicKey: ethers.ZeroHash,
        originChain: "ethereum",
        schema: "standard-kyc-v1",
        version: 1
      };

      const markTx = await adapter.connect(owner).markAsVerified(verificationParams);
      const markReceipt = await markTx.wait();

      // Get verification ID from the emitted event
      const verifiedEvent = markReceipt?.logs.find(
        log => log.topics[0] === adapter.interface.getEvent("UserVerified")?.topicHash
      );
      const verificationId: any = verifiedEvent?.data;



      // Now revoke the verification
      const revokeTx = await adapter.connect(owner).revokeVerification(user1.address, verificationId);
      const revokeReceipt = await revokeTx.wait();

      // Check if VerificationRevoked event was emitted
      const revokedEvent = revokeReceipt?.logs.find(
        log => log.topics[0] === adapter.interface.getEvent("VerificationRevoked")?.topicHash
      );
      const parsed = adapter.interface.parseLog(revokedEvent!);


      expect(revokedEvent).to.not.be.undefined;
      expect(parsed).to.not.be.null;
      expect(parsed?.args[0]).to.equal(user1.address);
      expect(parsed?.args[1]).to.equal(verificationId);
    });

    it("Should only allow owner to revoke verification", async function () {
      const { adapter, user1, user2 } = await loadFixture(deployAdapterFixture);

      await expect(
        adapter.connect(user1).revokeVerification(user2.address, "0x1234")
      ).to.be.revertedWithCustomError(adapter, "OwnableUnauthorizedAccount");
    });

    // it("Should fail if bridge revocation call fails", async function () {
    //   const { adapter, owner, user1 } = await loadFixture(deployAdapterFixture);
    //
    //   // Try to revoke with invalid verification ID
    //   await expect(
    //     adapter.connect(owner).revokeVerification(user1.address, "0x")
    //   ).to.be.revertedWith("Revoke verification failed");
    // });
  });

  describe("withdraw", function () {
    it("Should allow owner to withdraw funds", async function () {
      const { adapter, owner, user1 } = await loadFixture(deployAdapterFixture);

      // Send some ETH to the adapter
      await user1.sendTransaction({
        to: adapter.target,
        value: ethers.parseEther("1.0")
      });

      const initialBalance = await ethers.provider.getBalance(owner.address);

      await adapter.connect(owner).withdraw();

      const finalBalance = await ethers.provider.getBalance(owner.address);
      expect(finalBalance).to.be.gt(initialBalance);
    });

    it("Should prevent non-owners from withdrawing", async function () {
      const { adapter, user1 } = await loadFixture(deployAdapterFixture);

      await expect(
        adapter.connect(user1).withdraw()
      ).to.be.revertedWithCustomError(adapter, "OwnableUnauthorizedAccount");
    });

    it("Should revert if no balance to withdraw", async function () {
      const { adapter, owner } = await loadFixture(deployAdapterFixture);

      await expect(
        adapter.connect(owner).withdraw()
      ).to.be.revertedWith("No ether to withdraw");
    });
  });
});
