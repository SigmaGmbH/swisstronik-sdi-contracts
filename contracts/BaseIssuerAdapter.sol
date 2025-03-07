pragma solidity ^0.8.24;

import {ISWTRProxy} from "./interfaces/ISWTRProxy.sol";
import {IComplianceBridge} from "./interfaces/IComplianceBridge.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {IssuerAdapter} from "./interfaces/IssuerAdapter.sol";

contract BaseIssuerAdapter is Initializable, OwnableUpgradeable, UUPSUpgradeable, IssuerAdapter {
    // cost value (could be in wei if native currency, or token smallest unit)
    uint256 private cost;
    // If paymentToken is address(0), then the cost is in native currency;
    // otherwise, it represents an ERC-20 token address.
    address public paymentToken;

    // Emitted when cost or payment token is updated
    event CostUpdated(uint256 newCost, address paymentToken);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address initialOwner) public initializer {
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();

        cost = 0;
        paymentToken = address(0);
    }

    function _authorizeUpgrade(address newImplementation)
    internal
    override
    onlyOwner
    {}

    // Event now includes the verificationId in addition to the user address.
    event UserVerified(address userAddress, bytes verificationId);
    event VerificationRevoked(address userAddress, bytes verificationId);

    function withdraw() external payable onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ether to withdraw");

        (bool success,) = owner().call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    /**
     * @notice Unified function to mark a user as verified using a single struct of parameters.
     * @param params A struct containing all necessary parameters.
     * @return verificationId The verification id returned by the compliance bridge.
     */
    function markAsVerified(
        VerificationParams memory params
    ) public onlyOwner returns (bytes memory verificationId) {
        // Compute the issuance timestamp based on current block time.
        uint32 issuanceTimestamp = uint32(block.timestamp % 2 ** 32);
        bytes memory payload;
        if (params.publicKey == bytes32(0)) {
            // Call the V1 addVerificationDetails method.
            payload = abi.encodeCall(
                IComplianceBridge.addVerificationDetails,
                (
                    params.userAddress,
                    params.originChain,
                    uint32(params.verificationType),
                    issuanceTimestamp,
                    params.expirationTimestamp,
                    params.proofData,
                    params.schema,
                    params.id,
                    params.version
                )
            );
        } else {
            // Call the V2 addVerificationDetailsV2 method.
            payload = abi.encodeCall(
                IComplianceBridge.addVerificationDetailsV2,
                (
                    params.userAddress,
                    params.originChain,
                    uint32(params.verificationType),
                    issuanceTimestamp,
                    params.expirationTimestamp,
                    params.proofData,
                    params.schema,
                    params.id,
                    params.version,
                    params.publicKey
                )
            );
        }
        // Use precompile at address 1028 for the call.
        (bool success, bytes memory data) = address(1028).call(payload);
        require(success, string(abi.encodePacked("Verification failed: ", data)));
        verificationId = abi.decode(data, (bytes));
        emit UserVerified(params.userAddress, verificationId);
        return verificationId;
    }

    /**
     * @notice Revokes a verification.
     * @param userAddress The address of the user whose verification is to be revoked.
     * @param verificationId The verification id to revoke.
     */
    function revokeVerification(address userAddress, bytes memory verificationId) public onlyOwner {
        bytes memory payload = abi.encodeCall(
            IComplianceBridge.revokeVerification,
            (verificationId)
        );
        (bool success, bytes memory data) = address(1028).call(payload);
        require(success, string(abi.encodePacked("Revoke verification failed: ", data)));
        emit VerificationRevoked(userAddress, verificationId);
    }


    function getSupportedTypes() external virtual pure returns (ISWTRProxy.VerificationType[] memory) {
        ISWTRProxy.VerificationType[] memory types;
        return types;
    }

    /// @notice Allows the owner to update the cost and payment token.
    /// @param _cost The new cost value.
    /// @param _paymentToken The new payment token address.
    /// If using native currency, set this to address(0).
    function setCost(uint256 _cost, address _paymentToken) external onlyOwner {
        cost = _cost;
        paymentToken = _paymentToken;
        emit CostUpdated(_cost, _paymentToken);
    }

    /// @notice Returns the current cost.
    /// @return The cost value.
    function getCost() external view returns (uint256) {
        return cost;
    }
}
