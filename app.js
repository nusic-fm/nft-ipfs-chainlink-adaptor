const addFileToIpfs = require('./index').addFileToIpfs
const { Requester } = require('@chainlink/external-adapter')

const express = require('express')
const bodyParser = require('body-parser')
var cors = require('cors')

const app = express()
const port = process.env.PORT || 8080

app.use(cors())

app.use(bodyParser.json())

app.get('/', (req, res) => {
  res.send('NUSIC NFT server is up...')
})

app.post('/metadata', async (req, res) => {
  const obj = req.body
  console.log({ obj })
  const { nftBondAddress } = obj.data
  if (!nftBondAddress) {
    res.status(500)
  }
  const cid = await addFileToIpfs(nftBondAddress)
  console.log({ cid })
  res.status(200).json(Requester.success(0, { data: { result: '0' }, status: 200 }))
})

app.listen(port, () => console.log(`Listening on port ${port}!`))
