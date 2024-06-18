import { decryptNodeResponse, encryptDataField } from "@swisstronik/utils";
import { network } from "hardhat";

const NODE_RPC_URL = (network.config as any).url;

export const sendShieldedTransaction = async (
  signer: any,
  destination: string,
  data: string,
  value: string
) => {
  // Encrypt transaction data
  const [encryptedData] = await encryptDataField(NODE_RPC_URL, data);

  // Construct and sign transaction with encrypted data
  return await signer.sendTransaction({
    from: signer.address,
    to: destination,
    data: encryptedData,
    value,
    gasLimit: 2000000,
    // gasPrice: 0 // We're using 0 gas price in tests. Comment it, if you're running tests on actual network
  });
};

export const sendShieldedQuery = async (
  provider: any,
  destination: string,
  data: string,
  value: string
) => {
  // Encrypt call data
  const [encryptedData, usedEncryptedKey] = await encryptDataField(
    NODE_RPC_URL,
    data
  );

  // Do call
  const response = await provider.call({
    to: destination,
    data: encryptedData,
    value,
  });

  if (response.startsWith("0x08c379a0")) {
    return response;
  }

  // Decrypt call result
  return await decryptNodeResponse(NODE_RPC_URL, response, usedEncryptedKey);
};
