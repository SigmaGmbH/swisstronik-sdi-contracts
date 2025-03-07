pragma solidity ^0.8.24;

import "../BaseIssuerAdapter.sol";
import {ISWTRProxy} from "../interfaces/ISWTRProxy.sol";

contract TestIssuerAdapter is BaseIssuerAdapter {
    fallback() external payable {}

    receive() external payable {}

    // Dummy implementation: return an empty array.
    function getSupportedTypes() external pure override returns (ISWTRProxy.VerificationType[] memory) {
        ISWTRProxy.VerificationType[] memory types = new ISWTRProxy.VerificationType[](0);
        return types;
    }
}
