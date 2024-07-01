# Swisstronik SDI Contracts

## Overview

Contracts to interact witht the compliance module.

It's designed for managing issuer records and verifying user compliance based on various criteria. It leverages the OpenZeppelin library for secure contract upgradeability and ownership management. The contract interacts with the compliance module/bridge to verify user data against issuer records.

## Features

- **Issuer Management**: Add, update, and remove issuer records securely.
- **User Verification**: Verify users based on compliance criteria such as AML (Anti-Money Laundering) checks and humanity verification.
- **Data Retrieval**: List issuer records and verification data for users.
- **Upgradeability**: Utilizes OpenZeppelin's upgradeable contracts for future improvements without losing state.

## Functions

### Issuer Management

- `addIssuersRecord(string[] memory name, uint32[] memory version, address[] memory issuerAddress)`: Adds multiple issuer records.
- `removeIssuerRecord(string memory name, uint32 version)`: Removes an issuer record.
- `function getIssuerAddressesByNameAndVersions(`: Get list of Issuer addresses by their name and versions
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
| ProxyAdmin | `0xe49de5cAC6aa19E70499D89D04E475a7CcDC58C1` |
| SWTRProxy  | `0x7a838b0545513aC19920128Fdc8ECd25C9b1b1bD` |