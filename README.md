# Swisstronik SDI Contracts

## Overview

Contracts to interact witht the compliance module.

It's designed for managing issuer records and verifying user compliance based on various criteria. It leverages the OpenZeppelin library for secure contract upgradeability and ownership management. The contract interacts with the compliance module/bridge to verify user data against issuer records.

## Features

- **Issuer Management**: Add, update, and remove issuer records securely.
- **User Verification**: Verify users based on compliance criteria such as AML (Anti-Money Laundering) checks and humanity verification.
- **Data Retrieval**: List issuer records and verification data for users.
- **Data Decoding**: Decode original data formats for various verification systems (Quadrata Passport V1, Worldcoin V1, Compilot V1, Zeronym V1).
- **Upgradeability**: Utilize OpenZeppelin's upgradeable contract patterns to allow future improvements without state loss.

## Integration

In your solidity repository, run `npm i @swisstronik/sdi-contracts`

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
        // Example call; expirationTimestamp set to 0 if not used.
        return swtrProxy.isUserVerified(user, 0, verificationType);
    }

}
```


## Functions

### Issuer Management

- `addIssuersRecord(string[] memory name, uint32[] memory version, address[] memory issuerAddress)`: Adds multiple issuer records.
- `removeIssuerRecord(string memory name, uint32 version)`: Removes an issuer record.
- `getIssuerRecordByAddress(address issuerAddress)`: Gets the issuer record by its address.
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
#### decodeQuadrataPassportV1OriginalData(bytes memory originalData)

Decodes original data for Quadrata Passport V1 verification.

Returns:
- `uint8 aml`: AML score or status.
- `string country`: The country extracted from the data.
- `string did`: The decentralized identifier.
- `bool isBusiness`: Indicates if the entity is a business.
- `bool investorStatus`: Indicates the investor status.

#### decodeWorldcoinV1OriginalData(bytes memory originalData)

Decodes original data for Worldcoin V1 verification.

Returns:
- `string merkle_root`: The Merkle root.
- `string nullifier_hash`: The nullifier hash.
- `string proof`: The cryptographic proof.
- `string verification_level`: The verification level.

#### decodeCompilotV1OriginalData(bytes memory originalData)

Decodes original data for Compilot V1 verification.

Returns:
- `string riskScore`: The risk score.
- `uint32 createdAt`: The Unix timestamp when the record was created.
- `string status`: The status of the verification.

#### decodeZeronymV1OriginalData(bytes memory originalData)

Decodes original data for Zeronym V1 verification.

Returns:
- `bool isFromUs`: Indicates whether the user 
- `uint256 actionId`: An action identifier.
- `uint256 output1`: The first output value.
- `uint256 output2`: The second output value.

## Build

`npx hardhat compile`

## Deploy

`npx hardhat run scripts/deploy.ts --network mainnet`


## Deployed Contracts

| Contract   | Address                                    |
|------------|--------------------------------------------|
| ProxyAdmin | `0xB0da35bA30f6e2D03C40f4710090ce353E7eda57` |
| SWTRProxy  | `0xb4646662b94F94DdbfCCa75f1b57602E1C8A28F1` |
