const { MongoClient } = require('mongodb')
const config = require('../config')
let client = null
const genesisHeight = 0

const dbName = 'chainx-scan-v2'
const blockCollectionName = 'block'
const extrinsicCollectionName = 'extrinsic'
const eventCollectionName = 'event'
const statusCollectionName = 'status'

const mainScanName = 'main-scan-height'

let blockCol = null
let extrinsicCol = null
let statusCol = null
let eventCol = null
let db = null

async function initDb() {
  client = await MongoClient.connect(config.mongo.url)
  db = client.db(dbName)
  blockCol = db.collection(blockCollectionName)
  extrinsicCol = db.collection(extrinsicCollectionName)
  eventCol = db.collection(eventCollectionName)
  statusCol = db.collection(statusCollectionName)

  await _createIndexes()
}

async function _createIndexes() {
  if (!db) {
    console.error('Please call initDb first')
    process.exit(1)
  }

  await blockCol.createIndex({ 'header.number': -1 })
  await extrinsicCol.createIndex({
    'indexer.blockHeight': -1,
    'indexer.index': 1
  })
  await eventCol.createIndex({
    'indexer.blockHeight': -1,
    index: 1
  })
}

async function getBlockCollection() {
  if (!blockCol) {
    await initDb()
  }
  return blockCol
}

async function getExtrinsicCollection() {
  if (!extrinsicCol) {
    await initDb()
  }
  return extrinsicCol
}

async function getEventCollection() {
  if (!eventCol) {
    await initDb()
  }
  return eventCol
}

async function getStatusCollection() {
  if (!statusCol) {
    await initDb()
  }
  return statusCol
}

// 删除>=给定区块高度的数据
async function deleteDataFrom(blockHeight) {
  if (!blockCol || !extrinsicCol) {
    console.error(`First init db before delete data >= ${blockHeight}`)
    process.exit(1)
  }

  const {
    result: { ok: deleteBlockOk }
  } = await blockCol.deleteMany({ 'header.number': { $gte: blockHeight } })
  const {
    result: { ok: deleteExtrinsicOk }
  } = await extrinsicCol.deleteMany({
    'indexer.blockHeight': { $gte: blockHeight }
  })

  if (deleteBlockOk !== 1 || deleteExtrinsicOk !== 1) {
    console.error(`Fail to delete data >= ${blockHeight}`)
    process.exit(1)
  }
}

async function getFirstScanHeight() {
  const statusCol = await getStatusCollection()
  const heightInfo = await statusCol.findOne({ name: mainScanName })
  if (!heightInfo) {
    return genesisHeight
  } else if (typeof heightInfo.value === 'number') {
    return heightInfo.value + 1
  } else {
    console.error('数据库中扫描高度信息错误!')
    process.exit(1)
  }
}

async function updateScanHeight(height) {
  const statusCol = await getStatusCollection()
  await statusCol.findOneAndUpdate(
    { name: mainScanName },
    { $set: { value: height } },
    { upsert: true }
  )
}

module.exports = {
  getExtrinsicCollection,
  getBlockCollection,
  getStatusCollection,
  getEventCollection,
  getFirstScanHeight,
  updateScanHeight,
  deleteDataFrom
}
