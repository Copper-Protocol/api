import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { createReadStream } from "fs";
import {utils} from 'ethers'
import {log} from 'console'
// Sign the message
export async function signMessage(wallet, message) {
  // Create a wallet instance from the private key
  // const wallet = new Wallet(privateKey);

  // Sign the message
  const signature = await wallet.signMessage(message);
  // console.log('Signature:', signature);

  return signature;
}

// Verify the signature
export function verifyMessage(message, signature) {
  return utils.verifyMessage(message, signature)

}
export async function hashSignedMessage(wallet, message) {
  const signedMessage = await signMessage(wallet, message);
  const formattedMessage = signedMessage.startsWith('0x') ? signedMessage : '0x' + signedMessage;
  console.log('Formatted Message:', formattedMessage);

  const hashedMessage = utils.keccak256(formattedMessage.toString());
  console.log('Hashed Message:', hashedMessage);

  return hashedMessage;
}

export function  dblHashSignedMessage (wallet, msg) {
  const hashed = hashSignedMessage(wallet, msg)
  console.log({hashed})
  const dblHashed = hashSignedMessage(wallet, hashed)

  return dblHashed
}
function sha256Hash (text) {
  return createHash('sha256').update(text).digest('hex')
}
function keccak256Hash (text) {
  return createHash('keccak256').update(text).digest('hex')
}
/* Encrypt stream with hashPass */
export async function encryptStream(hashPass) {
  const iv = Buffer.from(randomBytes(16)); // Generate a random IV
  const key = sha256Hash(hashPass)
  log(iv, iv.length, key)
  const cipher = createCipheriv('aes-256-cbc', hashSignedMessage(hashPass), iv);

  // Create a transform stream that handles the encryption process
  const encryptStream_ = cipher;

  // Prepend the IV to the first chunk of data
  const firstChunk = Buffer.concat([iv, encryptStream_.read()]);
  encryptStream_.unshift(firstChunk);

  return encryptStream_;
}

/* Decrypt stream with hashPass */
export function decryptStream(hashPass) {
  let isFirstChunk = true;
  let iv;

  const decipher = createDecipheriv('aes-256-cbc', hashPass, iv);

  // Create a transform stream that handles the decryption process
  const decryptStream_ = decipher;

  // Read the IV from the first chunk
  decryptStream_.on('pipe', (source) => {
    source.once('data', (chunk) => {
      if (isFirstChunk) {
        isFirstChunk = false;
        iv = chunk.slice(0, 16); // Extract the IV from the first chunk
        decryptStream_.push(chunk.slice(16)); // Push the remaining data to the decryption stream
      } else {
        decryptStream_.push(chunk);
      }
    });
  });

  return decryptStream_;
}

/* Function to upload an encrypted file to IPFS */
export async function uploadEncryptedFileToIPFS(filePath, password, wallet) {
  console.log({wallet})
  // Create a read stream from the file
  const fileReadStream = createReadStream(filePath);
  const hashPass = await hashSignedMessage(wallet, password)
  // Create an encrypt stream with IV using your encryption utility
  const encryptStream_ = await encryptStream(hashPass);

  // Pipe the file stream through the encryption stream
  const encryptedStream = fileReadStream.pipe(encryptStream_);

  try {
    // Upload the encrypted stream to IPFS
    const added = await ipfsClient.add(encryptedStream);
    const url = `https://infura-ipfs.io/ipfs/${added.path}`;
    console.log('IPFS URI:', url);
    // Do something with the IPFS URL, e.g., updateFileUrl(url);
  } catch (error) {
    console.log('Error uploading encrypted file:', error);
  }
}