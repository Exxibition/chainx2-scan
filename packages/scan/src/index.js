const { u8aToHex } = require('@polkadot/util')
const { sleep } = require('./util')
const {
  getExtrinsicCollection,
  getBlockCollection,
  getEventCollection,
  getFirstScanHeight,
  updateScanHeight,
  deleteDataFrom
} = require('./mongoClient')
const { getApi, disconnect } = require('./api')
const {
  updateHeight,
  getLatestHeight,
  unsubscribeNewHead
} = require('./latestHead')

let preBlockHash = null

async function main() {
  await updateHeight()
  const api = await getApi()

  let scanHeight = await getFirstScanHeight()
  await deleteDataFrom(scanHeight)

  while (true) {
    const chainHeight = getLatestHeight()
    if (scanHeight > chainHeight) {
      // 如果要检索的高度大于现在的最大高度，那么等一等
      await sleep(1000)
      continue
    }

    let blockHash
    try {
      blockHash = await api.rpc.chain.getBlockHash(scanHeight)
    } catch (e) {
      console.log(e.message)
      await sleep(1000)
      continue
    }

    if (!blockHash) {
      // 正常情况下这种情况不应该出现，上边已经判断过`scanHeight > chainHeight`
      await sleep(1000)
      continue
    }

    const block = await api.rpc.chain.getBlock(blockHash)
    if (
      preBlockHash &&
      block.block.header.parentHash.toString('hex') !== preBlockHash
    ) {
      // 出现分叉，当前块的parentHash不等于数据库中的上一个块的hash
      const nonForkHeight = await findNonForkHeight(scanHeight)
      await updateScanHeight(nonForkHeight)
      scanHeight = nonForkHeight + 1
      preBlockHash = null
      await deleteDataFrom(scanHeight)
      continue
    }

    await handleBlock(block.block)
    preBlockHash = block.block.hash.toHex()

    await updateScanHeight(scanHeight++)
  }
}

async function findNonForkHeight(nowHeight) {
  const api = await getApi()

  let trialHeight = nowHeight
  let blockInDb = null
  let chainHash = null

  do {
    trialHeight -= 1
    const blockCol = await getBlockCollection()
    blockInDb = await blockCol.findOne({ 'header.number': trialHeight })
    chainHash = await api.rpc.chain.getBlockHash(trialHeight)
  } while (blockInDb.hash !== chainHash.toString())

  return trialHeight
}

async function handleEvents(events, indexer, extrinsics) {
  if (events.length <= 0) {
    return
  }

  const eventCol = await getEventCollection()
  const bulk = eventCol.initializeOrderedBulkOp()
  for (const { event, phase, topics } of events) {
    const phaseType = phase.type
    const phaseValue = phase.value.toNumber()
    const extrinsicHash = extrinsics[phaseValue].hash.toHex()

    const index = parseInt(event.index)
    const meta = event.meta.toJSON()
    const section = event.section
    const method = event.method
    const data = event.data.toJSON()

    bulk.insert({
      indexer,
      extrinsicHash,
      phase: {
        type: phaseType,
        value: phaseValue
      },
      index,
      section,
      method,
      meta,
      data,
      topics
    })
  }

  const result = await bulk.execute()
  if (result.result && !result.result.ok) {
    // TODO: 处理插入不成功的情况
  }
}

async function handleBlock(block) {
  const hash = block.hash.toHex()
  const blockJson = block.toJSON()
  const blockHeight = block.header.number.toNumber()
  const blockTime = extractBlockTime(block.extrinsics)
  const blockIndexer = { blockHeight, blockHash: hash, blockTime }

  const api = await getApi()
  const allEvents = await api.query.system.events.at(hash)
  await handleEvents(allEvents, blockIndexer, block.extrinsics)

  const blockCol = await getBlockCollection()
  const result = await blockCol.insertOne({ hash, blockTime, ...blockJson })
  if (result.result && !result.result.ok) {
    // FIXME: 处理插入不成功的情况
  }

  let index = 0
  for (const extrinsic of block.extrinsics) {
    await handleExtrinsic(extrinsic, {
      blockHeight,
      blockHash: hash,
      blockTime,
      index: index++
    })
  }

  console.log(`block ${blockHeight} inserted.`)
}

function extractBlockTime(extrinsics) {
  const setTimeExtrinsic = extrinsics.find(
    ex =>
      ex.method.sectionName === 'timestamp' && ex.method.methodName === 'set'
  )
  if (setTimeExtrinsic) {
    const { args } = setTimeExtrinsic.method.toJSON()
    return args.now
  }
}

async function handleExtrinsic(extrinsic, indexer) {
  const hash = extrinsic.hash.toHex()
  const callIndex = u8aToHex(extrinsic.callIndex)
  const { args } = extrinsic.method.toJSON()
  const name = extrinsic.method.methodName
  const section = extrinsic.method.sectionName
  if (section.toLowerCase() === 'xassets') {
    console.log(section)
  }
  const version = extrinsic.version
  const data = u8aToHex(extrinsic.data) // 原始数据
  const doc = { hash, indexer, section, name, callIndex, version, args, data }

  const exCol = await getExtrinsicCollection()
  const result = await exCol.insertOne(doc)
  if (result.result && !result.result.ok) {
    // FIXME: 处理交易插入不成功的情况
  }
}

main()
  .then(r => {
    // TODO:
  })
  .catch(err => {
    // TODO:
    console.error(err)
  })
  .finally(() => {
    if (typeof unsubscribeNewHead === 'function') {
      unsubscribeNewHead()
    }
    disconnect()
  })
