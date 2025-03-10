// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {IComplianceBridge} from "./interfaces/IComplianceBridge.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ISWTRProxy} from "./interfaces/ISWTRProxy.sol";

contract SWTRImplementation is ISWTRProxy, OwnableUpgradeable {
    Issuer[] public issuers;
    mapping(address => Issuer) public issuerByAddress;
    mapping(address => uint256) public issuerIndex;

    mapping(string name => mapping(uint32 version => address))
        public issuerAddressByNameAndVersion;

    function initialize(address _initialOwner) public initializer {
        __Ownable_init(_initialOwner);
    }

    function addIssuersRecord(
        string[] memory name,
        uint32[] memory version,
        address[] memory issuerAddress
    ) public onlyOwner {
        require(
            name.length == issuerAddress.length &&
                name.length == version.length,
            "Length mismatch"
        );


        for (uint256 i = 0; i < name.length; i++) {
            require(issuerAddress[i] != address (0), "Issuer has zero address");
            require(
                issuerByAddress[issuerAddress[i]].issuerAddress == address(0),
                "Issuer already exists"
            );
            require(
                issuerAddressByNameAndVersion[name[i]][version[i]] == address(0),
                "Name+version already exists"
            );
            Issuer memory issuer = Issuer({
                name: name[i],
                version: version[i],
                issuerAddress: issuerAddress[i]
            });
            issuers.push(issuer);
            issuerByAddress[issuerAddress[i]] = issuer;
            issuerIndex[issuerAddress[i]] = issuers.length - 1;

            issuerAddressByNameAndVersion[name[i]][version[i]] = issuerAddress[
                i
            ];
        }
    }

    function removeIssuerRecord(
        string memory name,
        uint32 version
    ) public onlyOwner {
        address issuerAddress = issuerAddressByNameAndVersion[name][version];
        require(
            issuerByAddress[issuerAddress].issuerAddress != address(0),
            "Issuer does not exist"
        );
        uint256 index = issuerIndex[issuerAddress];
        uint256 lastIndex = issuers.length - 1;

        if (index != lastIndex) {
            Issuer memory lastIssuer = issuers[lastIndex];
            issuers[index] = lastIssuer;
            issuerIndex[lastIssuer.issuerAddress] = index;
        }

        issuers.pop();

        delete issuerByAddress[issuerAddress];
        delete issuerIndex[issuerAddress];
        delete issuerAddressByNameAndVersion[name][version];
    }

    function getIssuerRecordByAddress(
        address issuerAddress
    ) public view returns (Issuer memory) {
        return issuerByAddress[issuerAddress];
    }

    function getIssuerAddressesByNameAndVersions(
        string memory name,
        uint32[] memory version
    ) public view returns (address[] memory) {
        address[] memory result = new address[](version.length);
        for (uint256 i = 0; i < version.length; i++) {
            result[i] = issuerAddressByNameAndVersion[name][version[i]];
        }
        return result;
    }

    function listIssuersRecord(
        uint256 start,
        uint256 end
    ) public view returns (Issuer[] memory) {
        require(start < end, "Invalid range");
        require(end <= issuers.length, "Invalid range");
        Issuer[] memory result = new Issuer[](end - start);
        for (uint256 i = start; i < end; i++) {
            result[i - start] = issuers[i];
        }
        return result;
    }

    function issuerRecordCount() public view returns (uint256) {
        return issuers.length;
    }

    function isUserVerified(
        address userAddress,
        uint32 expirationTimestamp,
        ISWTRProxy.VerificationType verificationType
    ) public view returns (bool) {
        address[] memory allowedIssuers;
        bytes memory payload = abi.encodeCall(
            IComplianceBridge.hasVerification,
            (userAddress, uint32(verificationType), expirationTimestamp, allowedIssuers)
        );
        (bool success, bytes memory data) = address(1028).staticcall(payload);
        if (success) {
            return abi.decode(data, (bool));
        } else {
            return false;
        }
    }

    function isUserVerifiedBy(
        address userAddress,
        uint32 expirationTimestamp,
        ISWTRProxy.VerificationType verificationType,
        address[] memory allowedIssuers
    ) public view returns (bool) {
        bytes memory payload = abi.encodeCall(
            IComplianceBridge.hasVerification,
            (userAddress, uint32(verificationType), expirationTimestamp, allowedIssuers)
        );
        (bool success, bytes memory data) = address(1028).staticcall(payload);
        if (success) {
            return abi.decode(data, (bool));
        } else {
            return false;
        }
    }

    function listVerificationData(
        address userAddress,
        address issuerAddress
    ) public view returns (ISWTRProxy.VerificationData[] memory) {
        bytes memory payload = abi.encodeCall(
            IComplianceBridge.getVerificationData,
            (userAddress, issuerAddress)
        );
        (bool success, bytes memory data) = address(1028).staticcall(payload);
        ISWTRProxy.VerificationData[] memory verificationData;
        if (success) {
            // Decode the bytes data into an array of structs
            verificationData = abi.decode(
                data,
                (ISWTRProxy.VerificationData[])
            );
        }
        return verificationData;
    }

    function getVerificationDataById(
        address userAddress,
        address issuerAddress,
        bytes memory verificationId
    ) public view returns (ISWTRProxy.VerificationData memory) {
        ISWTRProxy.VerificationData[]
            memory verificationData = listVerificationData(
                userAddress,
                issuerAddress
            );

        require(verificationData.length > 0, "No verification data found");

        for (uint256 i = 0; i < verificationData.length; i++) {
            if (keccak256(verificationData[i].verificationId) == keccak256(verificationId)) {
                return verificationData[i];
            }
        }

        revert("Verification not found");
    }

    function getIssuanceRoot() public view  returns (uint256 _root) {
        bytes memory payload = abi.encodeCall(IComplianceBridge.getIssuanceTreeRoot, ());
        (bool success, bytes memory data) = address(1028).staticcall(payload);
        if (!success) {
            revert PrecompileError({_data: data});
        }

        (_root) = abi.decode(data, (uint256));
    }

    function getRevocationRoot() public view  returns (uint256 _root) {
        bytes memory payload = abi.encodeCall(IComplianceBridge.getRevocationTreeRoot, ());
        (bool success, bytes memory data) = address(1028).staticcall(payload);
        if (!success) {
            revert PrecompileError({_data: data});
        }

        (_root) = abi.decode(data, (uint256));
    }

    function getVerificationCountry(
        address userAddress,
        address issuerAddress,
        ISWTRProxy.VerificationType verificationType
    ) public view returns (string memory) {
        ISWTRProxy.VerificationData[]
            memory verificationData = listVerificationData(
                userAddress,
                issuerAddress
            );

        require(verificationData.length > 0, "No verification data found");

        for (uint256 i = 0; i < verificationData.length; i++) {
            if (
                verificationData[i].verificationType == uint32(verificationType)
            ) {
                if (
                    Strings.equal(
                        verificationData[i].schema,
                        "quadrataPassportV1"
                    )
                ) {
                    (, string memory country, , , ) = abi.decode(
                        verificationData[i].originalData,
                        (uint8, string, string, bool, bool)
                    );
                    return country;
                }
            }
        }

        revert("Verification with country not found");
    }

    function decodeQuadrataPassportV1OriginalData(
        bytes memory originalData
    )
        public
        pure
        returns (
            uint8 aml,
            string memory country,
            string memory did,
            bool isBusiness,
            bool investorStatus
        )
    {
        (aml, country, did, isBusiness, investorStatus) = abi.decode(
            originalData,
            (uint8, string, string, bool, bool)
        );
    }

    function decodeWorldcoinV1OriginalData(
        bytes memory originalData
    )
        public
        pure
        returns (
            string memory merkle_root,
            string memory nullifier_hash,
            string memory proof,
            string memory verification_level
        )
    {
        (merkle_root, nullifier_hash, proof, verification_level) = abi.decode(
            originalData,
            (string, string, string, string)
        );
    }

    function decodeCompilotV1OriginalData(
        bytes memory originalData
    )
    public
    pure
    returns (
        string memory riskScore,
        uint32 createdAt,
        string memory status
    )
    {
        (riskScore, createdAt, status) = abi.decode(originalData, (string, uint32, string));
    }

    function decodeZeronymV1OriginalData(
        bytes memory originalData
    )
    public
    pure
    returns (
        bool isFromUs,
        uint256 actionId,
        uint256 output1,
        uint256 output2
    )
    {
        (isFromUs, actionId, output1, output2) = abi.decode(originalData, (bool, uint256, uint256, uint256));
    }


    function passedVerificationType(
        address userAddress,
        address issuerAddress,
        ISWTRProxy.VerificationType verificationType
    ) public view returns (bool) {
        ISWTRProxy.VerificationData[]
            memory verificationData = listVerificationData(
                userAddress,
                issuerAddress
            );

        for (uint256 i = 0; i < verificationData.length; i++) {
            if (
                verificationData[i].verificationType == uint32(verificationType)
            ) {
                return true;
            }
        }

        return false;
    }

    function isUserHuman(
        address userAddress,
        address issuerAddress
    ) public view returns (bool) {
        return
            passedVerificationType(
                userAddress,
                issuerAddress,
                ISWTRProxy.VerificationType.VT_HUMANITY
            );
    }

    function walletPassedAML(
        address userAddress,
        address issuerAddress
    ) public view returns (bool) {
        return
            passedVerificationType(
                userAddress,
                issuerAddress,
                ISWTRProxy.VerificationType.VT_AML
            );
    }
}
