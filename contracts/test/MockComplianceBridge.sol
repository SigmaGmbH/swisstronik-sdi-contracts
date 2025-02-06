pragma solidity ^0.8.24;

import {ISWTRProxy} from "../interfaces/ISWTRProxy.sol";
import {IComplianceBridge} from "../interfaces/IComplianceBridge.sol";

contract MockComplianceBridge is IComplianceBridge {
    mapping(address => mapping(uint32 => bool)) private verificationStatus;
    mapping(address => mapping(address => bool)) private issuerVerificationStatus;
    mapping(address => mapping(address => ISWTRProxy.VerificationData[])) private userVerificationData;

    function setVerificationStatus(address user, uint32 verificationType, bool status) external {
        verificationStatus[user][verificationType] = status;
    }

    function setIssuerVerificationStatus(address user, address issuer, bool status) external {
        issuerVerificationStatus[user][issuer] = status;
    }

    function setUserVerificationData(
        address userAddress,
        address issuerAddress,
        ISWTRProxy.VerificationData[] memory data
    ) external {
        delete userVerificationData[userAddress][issuerAddress];
        for (uint i = 0; i < data.length; i++) {
            userVerificationData[userAddress][issuerAddress].push(data[i]);
        }
    }

    /// @notice Adds verification details and returns a dummy bytes response.
    function addVerificationDetails(
        address userAddress,
        string memory originChain,
        uint32 verificationType,
        uint32 issuanceTimestamp,
        uint32 expirationTimestamp,
        bytes memory proofData,
        string memory schema,
        string memory issuerVerificationId,
        uint32 version
    ) external override returns (bytes memory) {
        // In a real implementation you would store and process the provided data.
        // For this mock we simply return a dummy response.
        return abi.encode("addVerificationDetails: dummy response");
    }

    /// @notice Adds verification details (version 2) and returns a dummy bytes response.
    function addVerificationDetailsV2(
        address userAddress,
        string memory originChain,
        uint32 verificationType,
        uint32 issuanceTimestamp,
        uint32 expirationTimestamp,
        bytes memory proofData,
        string memory schema,
        string memory issuerVerificationId,
        uint32 version,
        bytes32 publicKey
    ) external override returns (bytes memory) {
        // Dummy implementation returning a simple encoded string.
        return abi.encode("addVerificationDetailsV2: dummy response");
    }

    /// @notice Checks whether the user has a given verification.
    function hasVerification(
        address userAddress,
        uint32 verificationType,
        uint32 expirationTimestamp,
        address[] memory allowedIssuers
    ) external view override returns (bool) {
        if (allowedIssuers.length == 0) {
            return verificationStatus[userAddress][verificationType];
        }
        for (uint i = 0; i < allowedIssuers.length; i++) {
            if (issuerVerificationStatus[userAddress][allowedIssuers[i]]) {
                return true;
            }
        }
        return false;
    }

    function getVerificationData(
        address userAddress,
        address issuerAddress
    ) external view override returns (bytes memory) {
        ISWTRProxy.VerificationData[] storage storedData = userVerificationData[userAddress][issuerAddress];

        if (storedData.length == 0) {
            bytes[] memory emptyEncodedTuples = new bytes[](0);
            return abi.encode(emptyEncodedTuples);
        }

        bytes[] memory encodedTuples = new bytes[](storedData.length);
        for (uint i = 0; i < storedData.length; i++) {
            encodedTuples[i] = abi.encode(
                storedData[i].verificationType,
                storedData[i].verificationId,
                storedData[i].issuerAddress,
                storedData[i].originChain,
                storedData[i].issuanceTimestamp,
                storedData[i].expirationTimestamp,
                storedData[i].originalData,
                storedData[i].schema,
                storedData[i].issuerVerificationId,
                storedData[i].version
            );
        }
        return abi.encode(encodedTuples);
    }

    /// @notice Returns a dummy revocation tree root.
    function getRevocationTreeRoot() external override returns (bytes memory) {
        // In a real scenario, this would return the current revocation tree root.
        return abi.encode("revocationTreeRoot: dummy");
    }

    /// @notice Returns a dummy issuance tree root.
    function getIssuanceTreeRoot() external override returns (bytes memory) {
        // In a real scenario, this would return the current issuance tree root.
        return abi.encode("issuanceTreeRoot: dummy");
    }

    /// @notice Revokes a verification.
    function revokeVerification(bytes memory verificationId) external override {
        // In a real implementation, this would mark a verification as revoked.
        // For the mock, the function accepts the call without performing any operation.
    }

    /// @notice Converts a credential and returns a dummy conversion.
    function convertCredential(
        bytes memory verificationId,
        bytes memory publicKey
    ) external override returns (bytes memory) {
        // Dummy implementation: simply concatenates the two byte arrays.
        return abi.encodePacked(verificationId, publicKey);
    }
}
