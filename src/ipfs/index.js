/* eslint-disable no-console */

import { unixfs } from '@helia/unixfs'
import { MemoryBlockstore } from 'blockstore-core'
import { createHelia } from 'helia'
import { createReadStream } from 'node:fs'
import {existsSync} from 'node:fs'
// the blockstore is where we store the blocks that make up files. this blockstore
// stores everything in-memory - other blockstores are available:
//   - https://www.npmjs.com/package/blockstore-fs - a filesystem blockstore (for use in node)
//   - https://www.npmjs.com/package/blockstore-idb - an IndexDB blockstore (for use in browsers)
//   - https://www.npmjs.com/package/blockstore-level - a LevelDB blockstore (for node or browsers,
//                                        though storing files in a database is rarely a good idea)
const blockstore = new MemoryBlockstore()

// create a Helia node
const helia = await createHelia({
  blockstore
})

// create a filesystem on top of Helia, in this case it's UnixFS
const fs = unixfs(helia)

// we will use this TextEncoder to turn strings into Uint8Arrays
const encoder = new TextEncoder()
const ipfsDir = "/ipfs/staging"

const addDir = async function (dir) {
	const dirents = await fs.promises.readdir(dir, { withFileTypes: true });
	const links = [];

	for (const dirent of dirents) {
		const path = Path.join(dir, dirent.name);

		if (dirent.isDirectory()) {
			const link = await addDir(path);

			links.push({
				Hash: link.Hash,
				Name: dirent.name
			});
		} else {
			const cid = await unixfs.addFile({ content: fs.createReadStream(path) });

			links.push({ Name: dirent.name, Hash: cid });
		}
	}

	const metadata = new UnixFS({
		type: 'directory'
	});

	const buf = dagPB.encode({
		Data: metadata.marshal(),
		Links: links
	});

	const hash = await sha256.digest(buf);
	const cid = CID.create(1, dagPB.code, hash);

	return { Hash: cid };
};

async function addFile (fs, file) {
  const cid = await fs.addFile({ content: createReadStream(file) });
  console.log('Added file:', cid.toString())

  return cid.toString()
}

async function showFile (fs, cid) {
  // this decoder will turn Uint8Arrays into strings
  const decoder = new TextDecoder()
  let text = ''

  // read the file from the blockstore using the second Helia node
  for await (const chunk of fs.cat(cid)) {
    text += decoder.decode(chunk, {
      stream: true
    })
  }

  console.log('Added file contents:', text)
}
await addFile (fs, `${ipfsDir}/LibSov/EwellComplaint.pdf`)
// // create a second Helia node using the same blockstore
// const helia2 = await createHelia({
//   blockstore
// })

// // create a second filesystem
// const fs2 = unixfs(helia2)

for (const [peerIdString, peer] of discoveredPeers.entries()) {
  console.log(`${peerIdString}: ${peer.multiaddrs.toString()}`)
}