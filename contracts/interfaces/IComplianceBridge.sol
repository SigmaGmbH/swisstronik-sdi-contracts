// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

interface IComplianceBridge {
    function hasVerification(
        address userAddress,
        uint32 verificationType,
        uint32 expirationTimestamp,
        address[] memory allowedIssuers
    ) external returns (bool);

    function getVerificationData(
        address userAddress,
        address issuerAddress
    ) external returns (bytes memory);
}
