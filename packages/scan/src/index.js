const { u8aToHex,hexToString } = require('@chainx-v2/util')
const { sleep } = require('./util')
const {
  getExtrinsicCollection,
  getBlockCollection,
  getEventCollection,
  getFirstScanHeight,
  getAccountsCollection,
  updateScanHeight,
  deleteDataFrom
} = require('./mongoClient')
const { getApi, disconnect } = require('./api')
const {
  updateHeight,
  getLatestHeight,
  getUnSubscribeNewHeadFunction
} = require('./latestHead')
const { updateAssetsInfo } = require('./assetsInfo')
// const { updateChainProperties } = require('./chainProperties')
const { setSS58Format } = require('@chainx-v2/crypto')
const {
  extractAuthor,
  extractBlockTime,
  findNonForkHeight
} = require('./block')
const {
  listenAndUpdateValidators,
  getUnSubscribeValidatorsFunction
} = require('./validatorsInfo')
const { getPCXAssetByAccount,getOtherAssetByAccount } = require('./chainProperties')
let preBlockHash = null

async function main() {
  // 更新区块高度
  await updateHeight()
  // 初始化sdk
  const api = await getApi()
  // 设置测试网
  setSS58Format(42)
  // 监听并更新validators
  await listenAndUpdateValidators()
  // 获取首个扫描区块高度
  let scanHeight = await getFirstScanHeight()
  // 删除该扫描区块
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

    const validators = await api.query.session.validators.at(blockHash)
    const author = extractAuthor(validators, block.block.header)

    await handleBlock(block.block, author)
    preBlockHash = block.block.hash.toHex()

    await updateAssetsInfo(scanHeight)
    await updateScanHeight(scanHeight++)
  }
}


async function handleEvents(events, indexer, extrinsics) {
  if (events.length <= 0) {
    return
  }

  const eventCol = await getEventCollection()
  const bulk = eventCol.initializeOrderedBulkOp()
  for (const { event, phase, topics } of events) {
    const phaseType = phase.type
    let [phaseValue, extrinsicHash] = [null, null]
    if (!phase.isNull) {
      phaseValue = phase.isNull ? null : phase.value.toNumber()
      extrinsicHash = extrinsics[phaseValue].hash.toHex()
    }

    const index = parseInt(event.index)
    const meta = event.meta.toJSON()
    const section = event.section
    const method = event.method
    const data = event.data.toJSON()

    /**
     *
     * 处理账户
     *
     * */
    if (method == 'NewAccount') {
      console.log(event.data.toJSON());
      const account = event.data.toJSON();
      await handleAccounts(indexer, account);
    }

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

async function handleBlock(block, author) {
  // 获取区块的hash
  const hash = block.hash.toHex()
  const blockJson = block.toJSON()
  // 获取区块的高度
  const blockHeight = block.header.number.toNumber()
  // 获取区块交易时间
  const blockTime = extractBlockTime(block.extrinsics)
  // 组装 blockhHeight, blockHash, blockTime合成index
  const blockIndexer = { blockHeight, blockHash: hash, blockTime }

  const api = await getApi()
  const allEvents = await api.query.system.events.at(hash)
  // 从区块Hash中获取全部Event
  await handleEvents(allEvents, blockIndexer, block.extrinsics)

  const blockCol = await getBlockCollection()
  const result = await blockCol.insertOne({
    hash,
    blockTime,
    author,
    ...blockJson
  })
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

  //console.log(`block ${blockHeight} inserted.`)
}

async function handleAccounts(indexr, account) {
  const exCol = await getAccountsCollection()
  const balance = await getPCXAssetByAccount(account)
  const data = {
    indexr,
    "account": account[0],
    "balance" : balance
  }
  const result = await exCol.insertOne(data)
  if (result.result && !result.result.ok) {
    // TODO: 处理插入不成功的情况
    console.log("插入失败")
  }
}

/**
 *
 * 对Account账户进行交易,根据交易查询banlance
 *
 * */
async function handleAccountsExtrisicBalance(extrinsic,indexer,from, dest) {
  const col = await getAccountsCollection();
  const fromBalance = await getPCXAssetByAccount(from) ;
  const destBalnace = await getPCXAssetByAccount(dest);
  const fromOtherBalance = await getOtherAssetByAccount(from);
  const destOtherBalance = await  getOtherAssetByAccount(dest);

  // 更新from转出账户
  await col.findOneAndUpdate(
      { account: from },
      { $set: { balance : fromBalance, other: fromOtherBalance } },
      { upsert: true }
  )
  // 更新dest转出账户
  await col.findOneAndUpdate(
      { account: dest },
      { $set: { balance: destBalnace, other: destOtherBalance } },
      { upsert: true }
  )

}

/**
 *
 * 解析并处理交易
 *
*/
async function handleExtrinsic(extrinsic, indexer) {
  const hash = extrinsic.hash.toHex()
  const callIndex = u8aToHex(extrinsic.callIndex)
  const { args } = extrinsic.method.toJSON()
  const name = extrinsic.method.methodName
  const section = extrinsic.method.sectionName
  const signer = extrinsic._raw.signature.get('signer').toString()
  if (section.toLowerCase() === 'xassets') {
    console.log(section)
  }
  // 如果交易是转账，dest加上value, from 减去 value
  if (name == 'transfer') {
    await handleAccountsExtrisicBalance(extrinsic,indexer,signer,args.dest)
  }
  const version = extrinsic.version
  const data = u8aToHex(extrinsic.data) // 原始数据
  const datastring = hexToString(data);

  const doc = {
    hash,
    indexer,
    signer,
    section,
    name,
    callIndex,
    version,
    args,
    data
  }

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
  .finally(cleanUp)

function cleanUp() {
  console.log('clean up')
  const unsubscribeNewHead = getUnSubscribeNewHeadFunction()
  if (typeof unsubscribeNewHead === 'function') {
    unsubscribeNewHead()
  }
  const unSubscribeValidators = getUnSubscribeValidatorsFunction()
  if (typeof unSubscribeValidators === 'function') {
    unSubscribeValidators()
  }
  disconnect()
  process.exit(0)
}

process.on('SIGINT', cleanUp)
