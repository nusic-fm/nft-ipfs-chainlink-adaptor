const addFileToIpfs = require('./index').addFileToIpfs
const pinOnPinata = require('./index').pinOnPinata
const { Requester } = require('@chainlink/external-adapter')

const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const port = process.env.PORT || 8080

app.use(bodyParser.json())

app.get('/', (req, res) => {
  res.send('NUSIC NFT server is up...')
})

app.post('/metadata', async (req, res) => {
  const obj = req.body
  console.log({ obj })
  const { nftBondAddress } = obj
  if (!nftBondAddress) {
    res.status(500)
  }
  const cid = await addFileToIpfs(nftBondAddress)
  console.log({ cid })
  await pinOnPinata(cid)
  const baseUri = 'https://gateway.pinata.cloud/ipfs'
  const resultUri = `${baseUri}/${cid}`
  res.status(200).json(Requester.success(0, { data: { result: resultUri }, status: 200 }))
})

app.listen(port, () => console.log(`Listening on port ${port}!`))
