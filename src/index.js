import { create } from 'ipfs-http-client'
import { Buffer } from 'buffer'
import { createReadStream, readFileSync } from 'fs';
import { encryptStream, uploadEncryptedFileToIPFS } from './lib/utils.js';
import {Wallet, providers} from "ethers";

/* configure Infura auth settings */
const projectId = "xxx"
const projectSecret = "XXX"
const auth = 'Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64');

const provider = new providers.WebSocketProvider(process.env.MATIC_WS_PROVIDERS.split(',')[0])
const wallet = new Wallet(process.env.DEPLOYER_PRIVATE_KEY)
console.log(wallet.privateKey)
/* create the client */
const client = create({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
  headers: {
      authorization: auth,
  },
})

// Usage example
const filePath = 'test.txt';
const password = 'your-password';

uploadEncryptedFileToIPFS(filePath, password, wallet)
