import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { TestIssuerAdapter } from "../typechain-types";

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

    // Deploy TestIssuerAdapter as upgradeable contract
    const TestAdapter = await ethers.getContractFactory("TestIssuerAdapter");
    const adapter = await upgrades.deployProxy(TestAdapter, [owner.address], {
      initializer: 'initialize',
      kind: 'uups',
      unsafeAllow: ['constructor', 'delegatecall']
    }) as unknown as TestIssuerAdapter;

    // Confirm deployment and initialization
    await adapter.waitForDeployment();

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
  });

  describe("withdraw", function () {
    it("Should allow owner to withdraw funds", async function () {
      const { adapter, owner, user1 } = await loadFixture(deployAdapterFixture);

      // Send some ETH to the adapter
      await user1.sendTransaction({
        to: await adapter.getAddress(),
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

  describe("Cost functionality", function() {
    it("Should allow owner to set cost and payment token", async function() {
      const { adapter, owner } = await loadFixture(deployAdapterFixture);

      const cost = ethers.parseEther("0.1");
      const paymentToken = "0x1234567890123456789012345678901234567890";

      const tx = await adapter.connect(owner).setCost(cost, paymentToken);
      const receipt = await tx.wait();

      // Check event emission
      const event = receipt?.logs.find(
        log => log.topics[0] === adapter.interface.getEvent("CostUpdated")?.topicHash
      );
      expect(event).to.not.be.undefined;

      // Check values were updated
      const storedCost = await adapter.getCost();
      const storedToken = await adapter.paymentToken();

      expect(storedCost).to.equal(cost);
      expect(storedToken).to.equal(paymentToken);
    });

    it("Should prevent non-owners from setting cost", async function() {
      const { adapter, user1 } = await loadFixture(deployAdapterFixture);

      await expect(
        adapter.connect(user1).setCost(ethers.parseEther("0.1"), ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(adapter, "OwnableUnauthorizedAccount");
    });

    it("Should return zero as default cost", async function() {
      const { adapter } = await loadFixture(deployAdapterFixture);

      const cost = await adapter.getCost();
      expect(cost).to.equal(0);
    });

    it("Should return zero address as default payment token", async function() {
      const { adapter } = await loadFixture(deployAdapterFixture);

      const token = await adapter.paymentToken();
      expect(token).to.equal(ethers.ZeroAddress);
    });
  });

  describe("Upgrade functionality", function() {
    it("Should allow owner to upgrade implementation", async function() {
      const { adapter, owner } = await loadFixture(deployAdapterFixture);

      // Deploy a new implementation
      const TestAdapterV2 = await ethers.getContractFactory("TestIssuerAdapter");
      const upgradedAdapter = await upgrades.upgradeProxy(await adapter.getAddress(), TestAdapterV2, {
        kind: 'uups',
        unsafeAllow: ['constructor', 'delegatecall']
      });

      // Test that the instance is working
      const storedCost = await upgradedAdapter.getCost();
      expect(storedCost).to.equal(0);
    });

    describe("getSupportedTypes", function() {
      it("Should return empty array for base implementation", async function() {
        const { adapter } = await loadFixture(deployAdapterFixture);

        const supportedTypes = await adapter.getSupportedTypes();

        // The base implementation returns an empty array
        expect(supportedTypes).to.be.an('array').that.is.empty;
      });
    });

    it("Should prevent non-owners from upgrading implementation", async function() {
      const { adapter, user1 } = await loadFixture(deployAdapterFixture);

      const adapterConnectedToUser1 = adapter.connect(user1);

      // Try to directly call the _authorizeUpgrade function, which should fail
      await expect(
        adapterConnectedToUser1.upgradeToAndCall(ethers.ZeroAddress, "0x")
      ).to.be.revertedWithCustomError(adapter, "OwnableUnauthorizedAccount");
    });
  });
});
