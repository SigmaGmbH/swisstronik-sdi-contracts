// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

interface ISWTRProxy {

    error PrecompileError(bytes _data);

    struct VerificationData {
        // Verification type
        uint32 verificationType;
        // Verification Id
        bytes verificationId;
        // Verification issuer address
        address issuerAddress;
        // From which chain proof was transferred
        string originChain;
        // Original issuance timestamp
        uint32 issuanceTimestamp;
        // Original expiration timestamp
        uint32 expirationTimestamp;
        // Original proof data (ZK-proof)
        bytes originalData;
        // ZK-proof original schema
        string schema;
        // Verification id for checking(KYC/KYB/AML etc) from issuer side
        string issuerVerificationId;
        // Version
        uint32 version;
    }

    enum VerificationType {
        VT_UNSPECIFIED, // 0: defines an invalid/undefined verification type.
        VT_KYC, // 1: Know Your Customer
        VT_KYB, // 2: Know Your Business
        VT_KYW, // 3: Know Your Wallet
        VT_HUMANITY, // 4: Check humanity
        VT_AML, // 5: Anti Money Laundering (check transactions)
        VT_ADDRESS, // 6: Proof of Address
        VT_CUSTOM, // 7: Custom
        VT_CREDIT_SCORE, // 8: Credit Score
        VT_BIOMETRIC // 9: Biometric Passports and other types of biometric verification
    }

    struct Issuer {
        string name;
        uint32 version;
        address issuerAddress;
    }

    function getIssuerRecordByAddress(
        address issuerAddress
    ) external view returns (Issuer memory);

    function getIssuerAddressesByNameAndVersions(
        string memory name,
        uint32[] memory version
    ) external view returns (address[] memory);

    function listIssuersRecord(
        uint256 start,
        uint256 end
    ) external view returns (Issuer[] memory);

    function issuerRecordCount() external view returns (uint256);

    function isUserVerified(
        address userAddress,
        uint32 expirationTimestamp,
        ISWTRProxy.VerificationType verificationType
    ) external view returns (bool);

    function isUserVerifiedBy(
        address userAddress,
        uint32 expirationTimestamp,
        ISWTRProxy.VerificationType verificationType,
        address[] memory allowedIssuers
    ) external view returns (bool);

    function listVerificationData(
        address userAddress,
        address issuerAddress
    ) external view returns (ISWTRProxy.VerificationData[] memory);

    function getVerificationDataById(
        address userAddress,
        address issuerAddress,
        bytes memory verificationId
    ) external view returns (ISWTRProxy.VerificationData memory);

    function getIssuanceRoot() external view returns (uint256 _root);

    function getRevocationRoot() external view returns (uint256 _root);


    function getVerificationCountry(
        address userAddress,
        address issuerAddress,
        ISWTRProxy.VerificationType verificationType
    ) external view returns (string memory);

    function decodeQuadrataPassportV1OriginalData(
        bytes memory originalData
    )
        external
        pure
        returns (
            uint8 aml,
            string memory country,
            string memory did,
            bool isBusiness,
            bool investorStatus
        );

    function decodeWorldcoinV1OriginalData(
        bytes memory originalData
    )
        external
        pure
        returns (
            string memory merkle_root,
            string memory nullifier_hash,
            string memory proof,
            string memory verification_level
        );

    function decodeCompilotV1OriginalData(
        bytes memory originalData
    )
        external
        pure
        returns (
            string memory riskScore,
            uint32 createdAt,
            string memory status
        );

    function passedVerificationType(
        address userAddress,
        address issuerAddress,
        ISWTRProxy.VerificationType verificationType
    ) external view returns (bool);

    function walletPassedAML(
        address userAddress,
        address issuerAddress
    ) external view returns (bool);
}
