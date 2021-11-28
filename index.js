/* eslint-disable space-before-function-paren */
const ipfsClient = require('ipfs-http-client')
const pinataSDK = require('@pinata/sdk')
const { ethers } = require('ethers')
const pinata = pinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_SECRET_KEY)
require('dotenv').config()

const ipfs = ipfsClient.create({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https'
})
// const ipfs = ipfsClient.create({ url: '/ip4/127.0.0.1/tcp/5001' })
const bondNftabi = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function numberOfBonds() view returns (uint256)',
  'function assetPoolAddress() view returns (address)',
  'function setBaseURI(string uri) public'
]
const nodeUrl = `https://rinkeby.infura.io/v3/${process.env.INFURA_ID}`

const ratingArtMapping = {
  AAA: 'https://ipfs.io/ipfs/QmaJ5oKx9QzeFxaJLiuTKzsfRoaujjRd7n3ux6zKXxTkci/Nusic%20Bond%20Fractals/NusicFractal-01.svg',
  AA: 'https://ipfs.io/ipfs/QmaJ5oKx9QzeFxaJLiuTKzsfRoaujjRd7n3ux6zKXxTkci/Nusic%20Bond%20Fractals/NusicFractal-02.svg',
  A: 'https://ipfs.io/ipfs/QmaJ5oKx9QzeFxaJLiuTKzsfRoaujjRd7n3ux6zKXxTkci/Nusic%20Bond%20Fractals/NusicFractal-03.svg',
  III: 'https://ipfs.io/ipfs/QmaJ5oKx9QzeFxaJLiuTKzsfRoaujjRd7n3ux6zKXxTkci/Nusic%20Bond%20Fractals/NusicFractal-04.svg',
  II: 'https://ipfs.io/ipfs/QmaJ5oKx9QzeFxaJLiuTKzsfRoaujjRd7n3ux6zKXxTkci/Nusic%20Bond%20Fractals/NusicFractal-05.svg',
  I: 'https://ipfs.io/ipfs/QmaJ5oKx9QzeFxaJLiuTKzsfRoaujjRd7n3ux6zKXxTkci/Nusic%20Bond%20Fractals/NusicFractal-06.svg',
  UUU: 'https://ipfs.io/ipfs/QmaJ5oKx9QzeFxaJLiuTKzsfRoaujjRd7n3ux6zKXxTkci/Nusic%20Bond%20Fractals/NusicFractal-07.svg',
  UU: 'https://ipfs.io/ipfs/QmaJ5oKx9QzeFxaJLiuTKzsfRoaujjRd7n3ux6zKXxTkci/Nusic%20Bond%20Fractals/NusicFractal-08.svg',
  U: 'https://ipfs.io/ipfs/QmaJ5oKx9QzeFxaJLiuTKzsfRoaujjRd7n3ux6zKXxTkci/Nusic%20Bond%20Fractals/NusicFractal-09.svg',
  R: 'https://ipfs.io/ipfs/QmaJ5oKx9QzeFxaJLiuTKzsfRoaujjRd7n3ux6zKXxTkci/Nusic%20Bond%20Fractals/NusicFractal-10.svg'
}

async function addFileToIpfs(nftBondAddress) {
  const nftContract = getContract(nftBondAddress, bondNftabi, true)
  const name = await nftContract.name()
  // const symbol = await contract.symbol()
  const numberOfBondsBN = await nftContract.numberOfBonds()
  const numberOfBonds = parseInt(numberOfBondsBN.toString())
  console.log({ numberOfBonds })
  const assetPoolAddress = await nftContract.assetPoolAddress()
  // TODO
  const description = 'Minted from NUSIC'
  const files = []
  const getRatingAbi = ['function allocateRatingByAssetPoolAddress(address _assetPoolAddress, uint256 _couponRate) public view returns(string)']
  const ratingEngineContract = getContract(process.env.RATING_ENGINE_ADDRESS, getRatingAbi)
  // Default art for rating
  let image = ratingArtMapping.AA
  try {
    const rating = await ratingEngineContract.allocateRatingByAssetPoolAddress(assetPoolAddress, ethers.utils.parseEther('2'))
    image = ratingArtMapping[rating]
  } catch (e) {
    console.error(e)
    // Continues with default art for NFT, rating will be set in the next cycle
  }
  for (let i = 0; i < numberOfBonds; i++) {
    const doc = JSON.stringify({
      name,
      description,
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
  const resultUri = `ipfs://${cid}/`
  try {
    await nftContract.setBaseURI(resultUri)
  } catch (e) {
    console.error(e)
  }
  return cid
}
async function pinOnPinata(cid) {
  const obj = await pinata.pinByHash(cid)
  console.log({ obj })
}
function getContract(address, abi, isSigner = false) {
  const provider = new ethers.providers.JsonRpcProvider(nodeUrl)
  return new ethers.Contract(address, abi, new ethers.Wallet(process.env.KOVAN_PRIVATE_KEY, provider))
}
module.exports.addFileToIpfs = addFileToIpfs
module.exports.pinOnPinata = pinOnPinata
