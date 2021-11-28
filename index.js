/* eslint-disable space-before-function-paren */
const ipfsClient = require('ipfs-http-client')
const pinataSDK = require('@pinata/sdk')
const { ethers } = require('ethers')
require('dotenv').config()

const pinata = pinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_SECRET_KEY)

const ipfs = ipfsClient.create({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https'
})
// const ipfs = ipfsClient.create({ url: '/ip4/127.0.0.1/tcp/5001' })
const bondNftabi = [
  'function name() view returns (string)',
  'function numberOfBonds() view returns (uint256)',
  'function assetPoolAddress() view returns (address)',
  'function setBaseURI(string uri) public'
]
const nodeUrl = `https://rinkeby.infura.io/v3/${process.env.INFURA_ID}`

const ratingArtMapping = {
  AAA: 'ipfs://QmQZU7zwiGEQaimZDgogvZx1FHK1kzGrAEfeB4Ttg4qKQP/NusicFractal-01.png',
  AA: 'ipfs://QmQZU7zwiGEQaimZDgogvZx1FHK1kzGrAEfeB4Ttg4qKQP/NusicFractal-02.png',
  A: 'ipfs://QmQZU7zwiGEQaimZDgogvZx1FHK1kzGrAEfeB4Ttg4qKQP/NusicFractal-03.png',
  III: 'ipfs://QmQZU7zwiGEQaimZDgogvZx1FHK1kzGrAEfeB4Ttg4qKQP/NusicFractal-04.png',
  II: 'ipfs://QmQZU7zwiGEQaimZDgogvZx1FHK1kzGrAEfeB4Ttg4qKQP/NusicFractal-05.png',
  I: 'ipfs://QmQZU7zwiGEQaimZDgogvZx1FHK1kzGrAEfeB4Ttg4qKQP/NusicFractal-06.png',
  UUU: 'ipfs://QmQZU7zwiGEQaimZDgogvZx1FHK1kzGrAEfeB4Ttg4qKQP/NusicFractal-07.png',
  UU: 'ipfs://QmQZU7zwiGEQaimZDgogvZx1FHK1kzGrAEfeB4Ttg4qKQP/NusicFractal-08.png',
  U: 'ipfs://QmQZU7zwiGEQaimZDgogvZx1FHK1kzGrAEfeB4Ttg4qKQP/NusicFractal-09.png',
  R: 'ipfs://QmQZU7zwiGEQaimZDgogvZx1FHK1kzGrAEfeB4Ttg4qKQP/NusicFractal-10.png'
}

async function addFileToIpfs(nftBondAddress) {
  const nftContract = getContract(nftBondAddress, bondNftabi, true)
  const name = await nftContract.name()
  console.log({ name })
  // const symbol = await contract.symbol()
  const numberOfBondsBN = await nftContract.numberOfBonds()
  const numberOfBonds = parseInt(numberOfBondsBN.toString())
  console.log({ numberOfBonds })
  const assetPoolAddress = await nftContract.assetPoolAddress()
  const files = []
  const getRatingAbi = ['function allocateRatingByAssetPoolAddress(address _assetPoolAddress, uint256 _couponRate) public view returns(string)']
  const ratingEngineContract = getContract(process.env.RATING_ENGINE_ADDRESS, getRatingAbi)
  // Default art for rating
  let image = ratingArtMapping.AA
  try {
    const rating = await ratingEngineContract.allocateRatingByAssetPoolAddress(assetPoolAddress, ethers.utils.parseEther('2'))
    image = ratingArtMapping[rating]
    console.log('image is set using rating')
    // ipfs://QmVmSHqHVrykvMYZ3tHGu6EjXcFyZ93MNCjTkRv4dd5nui/319.png
  } catch (e) {
    console.error(e)
    // Continues with default art for NFT, rating will be set in the next cycle
  }
  for (let i = 0; i < numberOfBonds; i++) {
    const doc = JSON.stringify({
      name,
      description: `This is ${i + 1} of ${numberOfBonds} royalty bearing NFT music bonds issued by ${name}`,
      image
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
  const cid = results[results.length - 1].cid.toString()
  await pinOnPinata(cid)
  const resultUri = `https://gateway.pinata.cloud/ipfs/${cid}/`
  try {
    await nftContract.setBaseURI(resultUri)
    console.log('base uri is set')
  } catch (e) {
    console.error(e)
  }
  return cid
}
async function pinOnPinata(cid) {
  try {
    const obj = await pinata.pinByHash(cid)
    console.log({ obj })
  } catch (e) {
    console.log(e)
  }
}
function getContract(address, abi, isSigner = false) {
  const provider = new ethers.providers.JsonRpcProvider(nodeUrl)
  return new ethers.Contract(address, abi, new ethers.Wallet(process.env.KOVAN_PRIVATE_KEY, provider))
}
module.exports.addFileToIpfs = addFileToIpfs
module.exports.pinOnPinata = pinOnPinata
