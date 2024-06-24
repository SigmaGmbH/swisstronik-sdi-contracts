// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {TransparentUpgradeableProxy} from "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";

contract SWTRProxy is TransparentUpgradeableProxy {
    constructor(
        address _logic,
        bytes memory _data
    ) TransparentUpgradeableProxy(_logic, msg.sender, _data) {}

    // We call upgradeToAndCall to this address
    function proxyAdmin() external virtual returns (address) {
        return _proxyAdmin();
    }
}
