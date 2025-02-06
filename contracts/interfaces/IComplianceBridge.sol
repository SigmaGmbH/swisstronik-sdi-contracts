pragma solidity ^0.8.24;

interface IComplianceBridge {
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
    ) external returns (bytes memory);

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
    ) external returns (bytes memory);

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

    function getRevocationTreeRoot() external returns (bytes memory);

    function getIssuanceTreeRoot() external returns (bytes memory);

    function revokeVerification(bytes memory verificationId) external;

    function convertCredential(bytes memory verificationId, bytes memory publicKey) external returns (bytes memory);
}
