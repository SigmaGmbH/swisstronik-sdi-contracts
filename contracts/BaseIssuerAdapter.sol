pragma solidity ^0.8.24;

import {ISWTRProxy} from "./interfaces/ISWTRProxy.sol";
import {IComplianceBridge} from "./interfaces/IComplianceBridge.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IssuerAdapter} from "./interfaces/IssuerAdapter.sol";

contract BaseIssuerAdapter is Ownable, IssuerAdapter {
    constructor() Ownable(msg.sender) {}

    // Event now includes the verificationId in addition to the user address.
    event UserVerified(address userAddress, bytes verificationId);
    event VerificationRevoked(address userAddress, bytes verificationId);
    event CredentialConverted(bytes verificationId);


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
        uint32 issuanceTimestamp = uint32(block.timestamp % 2**32);
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

    /**
     * @notice Converts a credential by calling the ComplianceBridge.
     * @param verificationId The verification id to convert.
     * @param publicKey The public key to include in the conversion.
     */
    function convertCredential(bytes memory verificationId, bytes32 publicKey) public {
        bytes memory payload = abi.encodeCall(
            IComplianceBridge.convertCredential,
            (verificationId, abi.encodePacked(publicKey))
        );
        (bool success, bytes memory data) = address(1028).call(payload);
        require(success, string(abi.encodePacked("Convert credential failed: ", data)));
        emit CredentialConverted(verificationId);
    }


    function getSupportedTypes() external pure returns (ISWTRProxy.VerificationType[] memory) {
        ISWTRProxy.VerificationType[] memory types;
        return types;
    }
}
