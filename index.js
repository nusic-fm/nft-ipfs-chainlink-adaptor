/* eslint-disable space-before-function-paren */
const ipfsClient = require('ipfs-http-client')
const pinataSDK = require('@pinata/sdk')
const { ethers } = require('ethers')
const pinata = pinataSDK('7c809656e4adb0d74ad1', '4fed0c63a69cab565fa90b1cac5a1827b4f8c23f3c7774d0fac19243e44f3cec')

const ipfs = ipfsClient.create({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https'
})
// const ipfs = ipfsClient.create({ url: '/ip4/127.0.0.1/tcp/5001' })
const abi = ['function name() view returns (string)', 'function symbol() view returns (string)', 'function numberOfBonds() view returns (uint256)']
const nodeUrl = 'https://kovan.infura.io/v3/8a96c8751a3a47e4a0c63ecaeef558d4'

async function addFileToIpfs(nftBondAddress) {
  const provider = new ethers.providers.JsonRpcProvider(nodeUrl)
  const contract = new ethers.Contract(nftBondAddress, abi, provider)
  const name = await contract.name()
  console.log({ name })
  // const symbol = await contract.symbol()
  const numberOfBondsBN = await contract.numberOfBonds()
  const numberOfBonds = parseInt(numberOfBondsBN.toString())
  console.log({ numberOfBonds })
  const description = ''
  const files = []
  for (let i = 0; i < numberOfBonds; i++) {
    const doc = JSON.stringify({
      name,
      description,
      // TODO
      image: 'https://ipfs.io/ipfs/QmaJ5oKx9QzeFxaJLiuTKzsfRoaujjRd7n3ux6zKXxTkci/Nusic%20Bond%20Fractals/NusicFractal-03.svg'
    })
    files.push({
      path: `/${nftBondAddress}/${i}.json`,
      content: doc
    })
  }
  const results = []
  for await (const result of ipfs.addAll(files)) {
    console.log(result)
    results.push(result)
  }
  return results[results.length - 1].cid.toString()
}
async function pinOnPinata(cid) {
  const obj = await pinata.pinByHash(cid)
  console.log({ obj })
}

module.exports.addFileToIpfs = addFileToIpfs
module.exports.pinOnPinata = pinOnPinata
