pragma solidity ^0.8.24;

import {ISWTRProxy} from "../interfaces/ISWTRProxy.sol";
import {IComplianceBridge} from "../interfaces/IComplianceBridge.sol";

contract MockComplianceBridge is IComplianceBridge {
    mapping(address => mapping(uint32 => bool)) private verificationStatus;
    mapping(address => mapping(address => bool)) private issuerVerificationStatus;
    mapping(address => mapping(address => ISWTRProxy.VerificationData[])) private userVerificationData;
    mapping(address => address[]) private userIssuers;
    mapping(bytes32 => bool) private revokedVerifications;

    bytes32 public issuanceTreeRoot;
    bytes32 public revocationTreeRoot;

    /// @dev Returns true if the given issuer is already recorded for this user.
    function _containsIssuer(address user, address issuer) internal view returns (bool) {
        address[] storage issuers = userIssuers[user];
        for (uint i = 0; i < issuers.length; i++) {
            if (issuers[i] == issuer) {
                return true;
            }
        }
        return false;
    }

    /// @dev Internal helper that stores a verification record.
    function _storeVerification(
        address userAddress,
        uint32 verificationType,
        bytes32 verificationId,
        string memory originChain,
        uint32 issuanceTimestamp,
        uint32 expirationTimestamp,
        bytes memory proofData,
        string memory schema,
        string memory issuerVerificationId,
        uint32 version
    ) internal {
        // Push the new verification data into storage.
        userVerificationData[userAddress][msg.sender].push(
            ISWTRProxy.VerificationData({
                verificationType: verificationType,
                verificationId: abi.encodePacked(verificationId),
                issuerAddress: msg.sender,
                originChain: originChain,
                issuanceTimestamp: issuanceTimestamp,
                expirationTimestamp: expirationTimestamp,
                originalData: proofData,
                schema: schema,
                issuerVerificationId: issuerVerificationId,
                version: version
            })
        );
        // Mark the issuer as having verified this user.
        issuerVerificationStatus[userAddress][msg.sender] = true;
        // Record the issuer if not already in the list.
        if (!_containsIssuer(userAddress, msg.sender)) {
            userIssuers[userAddress].push(msg.sender);
        }
        // Update the verification status for the given type.
        verificationStatus[userAddress][verificationType] = true;
        // Update the issuance tree root in a dummy manner.
        issuanceTreeRoot = keccak256(abi.encodePacked(issuanceTreeRoot, verificationId));
    }

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
        // Generate a unique verificationId.
        bytes32 verificationId = keccak256(
            abi.encodePacked(userAddress, msg.sender, block.timestamp, originChain, verificationType)
        );
        _storeVerification(
            userAddress,
            verificationType,
            verificationId,
            originChain,
            issuanceTimestamp,
            expirationTimestamp,
            proofData,
            schema,
            issuerVerificationId,
            version
        );
        return abi.encodePacked(verificationId);
    }

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
        // Generate a unique verificationId.
        bytes32 verificationId = keccak256(
            abi.encodePacked(userAddress, msg.sender, block.timestamp, originChain, verificationType)
        );
        // Combine proofData with the publicKey for version 2.
        bytes memory combinedData = abi.encodePacked(proofData, publicKey);
        _storeVerification(
            userAddress,
            verificationType,
            verificationId,
            originChain,
            issuanceTimestamp,
            expirationTimestamp,
            combinedData,
            schema,
            issuerVerificationId,
            version
        );
        return abi.encodePacked(verificationId);
    }

    function hasVerification(
        address userAddress,
        uint32 verificationType,
        uint32 expirationTimestamp,
        address[] memory allowedIssuers
    ) external view override returns (bool) {
        // First, if allowed issuers are provided, check if any of those issuers marked the user as verified.
        if (allowedIssuers.length > 0) {
            for (uint i = 0; i < allowedIssuers.length; i++) {
                if (issuerVerificationStatus[userAddress][allowedIssuers[i]]) {
                    return true;
                }
            }
        } else {
            // If no allowed issuers are provided, check the general verification flag.
            if (verificationStatus[userAddress][verificationType]) {
                return true;
            }
        }
        // Next, check stored verification records if any exist.
        // If allowedIssuers array is empty, use the list of issuers recorded for this user.
        address[] memory issuers = allowedIssuers.length == 0 ? userIssuers[userAddress] : allowedIssuers;
        for (uint i = 0; i < issuers.length; i++) {
            ISWTRProxy.VerificationData[] storage verifications = userVerificationData[userAddress][issuers[i]];
            for (uint j = 0; j < verifications.length; j++) {
                if (verifications[j].verificationType == verificationType) {
                    // If an expiration timestamp is provided, check that the stored record's expiration is not earlier.
                    if (expirationTimestamp == 0 || verifications[j].expirationTimestamp >= expirationTimestamp) {
                        bytes32 vIdHash = keccak256(verifications[j].verificationId);
                        if (!revokedVerifications[vIdHash]) {
                            return true;
                        }
                    }
                }
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

    function getRevocationTreeRoot() external override returns (bytes memory) {
        return abi.encode(revocationTreeRoot);
    }

    function getIssuanceTreeRoot() external override returns (bytes memory) {
        return abi.encode(issuanceTreeRoot);
    }

    function revokeVerification(bytes memory verificationId) external override {
        bytes32 vIdHash = keccak256(verificationId);
        revokedVerifications[vIdHash] = true;
        // Update the revocation tree root in a dummy way.
        revocationTreeRoot = keccak256(abi.encodePacked(revocationTreeRoot, verificationId));
    }

    function convertCredential(
        bytes memory verificationId,
        bytes memory publicKey
    ) external override returns (bytes memory) {
        return abi.encodePacked(verificationId, publicKey);
    }
}
