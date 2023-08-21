import { createHelia } from 'helia'
import { createLibp2p, Libp2pOptions } from 'libp2p'
import { tcp } from '@libp2p/tcp'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { MemoryBlockstore } from 'blockstore-core'
import { MemoryDatastore } from 'datastore-core'
// import type { Helia } from '@helia/interface'

import { CID } from 'multiformats/cid'
import * as Block from 'multiformats/block'
import * as codec from '@ipld/dag-cbor'
import { sha256 as hasher } from 'multiformats/hashes/sha2'

// takes description of the dynamic content (protocol + params)
// returns manifest (Block) and dynamic-content id (CID)
export async function DynamicContent (
  { protocol, param }
) {

  // create manifest
  const manifest = await Block.encode({ value: { protocol, param }, codec, hasher })

  // create dcid
  const dynamic = new TextEncoder().encode('dynamic')
  const bytes = new Uint8Array(dynamic.length + manifest.cid.multihash.digest.length)
  bytes.set(dynamic)
  bytes.set(manifest.cid.multihash.digest, dynamic.length)
  const dcid = CID.create(
    manifest.cid.version,
    manifest.cid.code,
    await hasher.digest(bytes)
  )

  return { id: dcid, manifest }
}

export async function createHeliaNode (config) {
  const blockstore = new MemoryBlockstore()
  const datastore = new MemoryDatastore()

  const libp2p = await createLibp2p({
    addresses: {
      listen: [
        '/ip4/127.0.0.1/tcp/0'
      ]
    },
    transports: [
      tcp()
    ],
    connectionEncryption: [
      noise()
    ],
    streamMuxers: [
      yamux()
    ],
    datastore,
    nat: {
      enabled: false
    },
    ...config
  })

  const helia = await createHelia({
    libp2p,
    blockstore,
    datastore
  })

  return helia
}