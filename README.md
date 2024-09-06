# Swisstronik SDI Contracts

## Overview

Contracts to interact witht the compliance module.

It's designed for managing issuer records and verifying user compliance based on various criteria. It leverages the OpenZeppelin library for secure contract upgradeability and ownership management. The contract interacts with the compliance module/bridge to verify user data against issuer records.

## Features

- **Issuer Management**: Add, update, and remove issuer records securely.
- **User Verification**: Verify users based on compliance criteria such as AML (Anti-Money Laundering) checks and humanity verification.
- **Data Retrieval**: List issuer records and verification data for users.
- **Upgradeability**: Utilizes OpenZeppelin's upgradeable contracts for future improvements without losing state.

## Integration

In your solidty repository, run `npm i @swisstronik/sdi-contracts`

```solidity

pragma solidity ^0.8.24;

import {ISWTRProxy} from "@swisstronik/sdi-contracts/contracts/interfaces/ISWTRProxy.sol";

contract Sample {
    ISWTRProxy public swtrProxy;
    
    constructor(ISWTRProxy _swtrProxy) { swtrProxy = _swtrProxy; }

    function isUserVerified(
        address user,
        ISWTRProxy.VerificationType verificationType
    ) public view returns (bool) {
      return swtrProxy.isUserVerified(user,verificationType);
    }

}
```


## Functions

### Issuer Management

- `addIssuersRecord(string[] memory name, uint32[] memory version, address[] memory issuerAddress)`: Adds multiple issuer records.
- `removeIssuerRecord(string memory name, uint32 version)`: Removes an issuer record.
- ` function getIssuerRecordByAddress(address issuerAddress)`: Gets the issuer record by its address.
- `getIssuerAddressesByNameAndVersions(string memory name, uint32[] memory version)`: Get list of Issuer addresses by their name and versions
- `updateIssuerRecord(address issuerAddress, string memory name)`: Updates the name of an issuer.
- `listIssuersRecord(uint256 start, uint256 end)`: Lists issuer records within a specified range.
- `issuerRecordCount()`: Returns the total number of issuer records.

### User Verification

- `isUserVerified(address userAddress, IComplianceBridge.VerificationType verificationType)`: Checks if a user is verified based on a specific verification type.
- `isUserVerifiedBy(address userAddress, IComplianceBridge.VerificationType verificationType, address[] memory allowedIssuers)`: Checks if a user is verified by specific issuers.
- `listVerificationData(address userAddress, address issuerAddress)`: Lists verification data for a user by an issuer.
- `getVerificationDataById(address userAddress, address issuerAddress, bytes memory verificationId)`: Retrieves verification data by ID.
- `getVerificationCountry(address userAddress, address issuerAddress, IComplianceBridge.VerificationType verificationType)`: Retrieves the country associated with a verification.
- `passedVerificationType(address userAddress, address issuerAddress, IComplianceBridge.VerificationType verificationType)`: Checks if a user has passed a specific verification type.
- `isUserHuman(address userAddress, address issuerAddress)`: Checks if a user has passed humanity verification.
- `walletPassedAML(address userAddress, address issuerAddress)`: Checks if a user's wallet has passed AML checks.

### Data Decoding

- `decodeQuadrataPassportV1OriginalData(bytes memory originalData)`: Decodes data for Quadrata Passport V1.
- `decodeWorldcoinV1OriginalData(bytes memory originalData)`: Decodes data for Worldcoin V1.

## Build

`npx hardhat compile`

## Deploy

`npx hardhat run scripts/deploy.ts --network testnet`


## Deployed Contracts

| Contract   | Address                                    |
|------------|--------------------------------------------|
| ProxyAdmin | `0x96e3ba5a33d21f64E5504Fd964656d1535a87F7e` |
| SWTRProxy  | `0xBF896E5616d12fE6Bd7a376D2DBb924ff531CFDF` |