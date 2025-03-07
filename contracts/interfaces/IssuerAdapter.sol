pragma solidity ^0.8.24;

import "./ISWTRProxy.sol";

interface IssuerAdapter {
    // Structure to group all parameters for marking a user as verified.
    struct VerificationParams {
        address userAddress;
        string id; // issuer's verification id string
        bytes proofData; // proof data (or originalData)
        uint32 expirationTimestamp; // expiration timestamp (0 means no expiration)
        ISWTRProxy.VerificationType verificationType; // type of verification
        bytes32 publicKey; // if nonzero, use V2 function; if zero, use V1
        string originChain; // origin chain string
        string schema; // schema string
        uint32 version; // version number
    }

    function withdraw() external payable;
    function getSupportedTypes() external pure returns (ISWTRProxy.VerificationType[] memory);
    function markAsVerified(VerificationParams memory params) external returns (bytes memory);
    function revokeVerification(address userAddress, bytes memory verificationId) external;
    function setCost(uint256 _cost, address _paymentToken) external;
    function getCost() external view returns (uint256);
}
