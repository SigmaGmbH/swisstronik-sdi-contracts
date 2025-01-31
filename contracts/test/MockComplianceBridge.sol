// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {ISWTRProxy} from "../interfaces/ISWTRProxy.sol";
import {IComplianceBridge} from "../interfaces/IComplianceBridge.sol";

contract MockComplianceBridge is IComplianceBridge {
    mapping(address => mapping(uint32 => bool)) private verificationStatus;
    mapping(address => mapping(address => bool)) private issuerVerificationStatus;
    mapping(address => mapping(address => ISWTRProxy.VerificationData[]))
    private userVerificationData;

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

    function hasVerification(
        address userAddress,
        uint32 verificationType,
        uint32 expirationTimestamp,
        address[] memory allowedIssuers
    ) external view returns (bool) {
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

        bytes memory result = abi.encode(encodedTuples);
        return result;
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
    ) external override {
        revert("Not implemented");
    }
}
