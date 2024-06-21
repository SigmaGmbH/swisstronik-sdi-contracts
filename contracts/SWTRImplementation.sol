// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {IComplianceBridge} from "./IComplianceBridge.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract SWTRImplementation is OwnableUpgradeable {
    struct Issuer {
        string name;
        address issuerAddress;
    }

    Issuer[] public issuers;
    mapping(address => Issuer) public issuerByAddress;
    mapping(address => uint256) issuerIndex;

    function initialize() public initializer {
        __Ownable_init(msg.sender);
    }

    function addIssuersRecord(
        string[] memory name,
        address[] memory issuerAddress
    ) public onlyOwner {
        require(
            name.length == issuerAddress.length,
            "Name and address length mismatch"
        );

        for (uint256 i = 0; i < name.length; i++) {
            require(
                issuerByAddress[issuerAddress[i]].issuerAddress == address(0),
                "Issuer already exists"
            );
            Issuer memory issuer = Issuer(name[i], issuerAddress[i]);
            issuers.push(issuer);
            issuerByAddress[issuerAddress[i]] = issuer;
            issuerIndex[issuerAddress[i]] = issuers.length - 1;
        }
    }

    function removeIssuerRecord(address issuerAddress) public onlyOwner {
        require(
            issuerByAddress[issuerAddress].issuerAddress != address(0),
            "Issuer does not exist"
        );
        uint256 index = issuerIndex[issuerAddress];

        issuers[index] = issuers[issuers.length - 1];
        issuers.pop();

        delete issuerByAddress[issuerAddress];
        delete issuerIndex[issuerAddress];
    }

    function updateIssuerRecord(
        address issuerAddress,
        string memory name
    ) public onlyOwner {
        require(
            issuerByAddress[issuerAddress].issuerAddress != address(0),
            "Issuer does not exist"
        );
        uint256 index = issuerIndex[issuerAddress];
        issuers[index].name = name;

        issuerByAddress[issuerAddress].name = name;
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
        IComplianceBridge.VerificationType verificationType
    ) public view returns (bool) {
        address[] memory allowedIssuers;
        bytes memory payload = abi.encodeCall(
            IComplianceBridge.hasVerification,
            (userAddress, uint32(verificationType), 0, allowedIssuers)
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
        IComplianceBridge.VerificationType verificationType,
        address[] memory allowedIssuers
    ) public view returns (bool) {
        bytes memory payload = abi.encodeCall(
            IComplianceBridge.hasVerification,
            (userAddress, uint32(verificationType), 0, allowedIssuers)
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
    ) public view returns (IComplianceBridge.VerificationData[] memory) {
        bytes memory payload = abi.encodeCall(
            IComplianceBridge.getVerificationData,
            (userAddress, issuerAddress)
        );
        (bool success, bytes memory data) = address(1028).staticcall(payload);
        IComplianceBridge.VerificationData[] memory verificationData;
        if (success) {
            // Decode the bytes data into an array of structs
            verificationData = abi.decode(
                data,
                (IComplianceBridge.VerificationData[])
            );
        }
        return verificationData;
    }

    function getVerificationDataById(
        address userAddress,
        address issuerAddress,
        bytes memory verificationId
    ) public view returns (IComplianceBridge.VerificationData[] memory) {
        IComplianceBridge.VerificationData[]
            memory verificationData = listVerificationData(
                userAddress,
                issuerAddress
            );

        require(verificationData.length > 0, "No verification data found");

        for (uint256 i = 0; i < verificationData.length; i++) {
            if (
                Strings.equal(
                    string(verificationData[i].verificationId),
                    string(verificationId)
                )
            ) {
                return verificationData;
            }
        }

        revert("Verification not found");
    }

    function getVerificationCountry(
        address userAddress,
        address issuerAddress,
        IComplianceBridge.VerificationType verificationType
    ) public view returns (string memory) {
        IComplianceBridge.VerificationData[]
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

    function passedVerificationType(
        address userAddress,
        address issuerAddress,
        IComplianceBridge.VerificationType verificationType
    ) public view returns (bool) {
        IComplianceBridge.VerificationData[]
            memory verificationData = listVerificationData(
                userAddress,
                issuerAddress
            );

        require(verificationData.length > 0, "No verification data found");

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
                IComplianceBridge.VerificationType.VT_HUMANITY
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
                IComplianceBridge.VerificationType.VT_AML
            );
    }
}
