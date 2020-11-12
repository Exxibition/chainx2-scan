const { setLatestChainStatus } = require('../store')
const { FEED_INTERVAL } = require('./constant')
const { latestChainStatusRoom } = require('./constant')
const { getBlockCollection } = require('../services/mongo')
const { getApi } = require('../api')
const { getExtrinsicCollection } = require('../services/mongo')
const { getEventCollection } = require('../services/mongo')
const { getStatusCollection } = require('../services/mongo')
const { getAccountsCollection } = require('../services/mongo')
const { getValidatorsCollection } = require('../services/mongo')
const { getTransferColCollection } = require('../services/mongo')

let chainStatus = {}
let latestHeader = {}

async function feedLatestChainStatus(io) {
  try {
    const api = await getApi()

    // 最新区块高度
    /*
    const statusCol = await getStatusCollection()
    const heightInfo = await statusCol.findOne({ name: 'main-scan-height' })
    chainStatus.best = heightInfo.latestHeight
    */
    const subscribeNewHeads = await api.rpc.chain.subscribeNewHeads(
      async header => {
        // console.log('get latest header', data)
        latestHeader = await header
      }
    )
    const latestHeight = latestHeader.number
      ? latestHeader.number.toNumber()
      : 0
    chainStatus.best = latestHeight

    // 已确认区块高度
    const finalizedHead = await api.rpc.chain.getFinalizedHead()
    const latestFinalizedBlockHeader = await api.rpc.chain.getHeader(
      finalizedHead
    )
    const finalizedHeight = latestFinalizedBlockHeader.number.toNumber()
    chainStatus.finalized = finalizedHeight

    // 已扫描区块高度
    const statusCol = await getStatusCollection()
    const statusInfo = await statusCol.findOne({ name: 'main-scan-height' })
    chainStatus.scan_height = statusInfo.value

    // 交易总数
    const extrinsicCol = await getExtrinsicCollection()
    const extrinsicCount = await extrinsicCol.countDocuments({})
    chainStatus.extrinsic_count = extrinsicCount

    // 账户总数
    const accountCol = await getAccountsCollection()
    const accountCount = await accountCol.countDocuments({})
    chainStatus.account_count = accountCount

    // 事件总数
    const eventCol = await getEventCollection()
    const eventCount = await eventCol.countDocuments({})
    chainStatus.event_count = eventCount

    // 转账总数
    const transferCol = await getTransferColCollection()
    const transferCount = await transferCol.countDocuments({})
    chainStatus.transfer_count = transferCount

    const validatorCol = await getValidatorsCollection()
    // 验证节点总数
    const validatorCount = await validatorCol.countDocuments({
      isValidating: true
    })
    chainStatus.validator_count = validatorCount

    // 1.节点抵押总数
    // 2.用户投票总数
    // 注：现在用的是节点得票总数，另外将用户的投票总数加起来也可以得到
    const allValidators = await validatorCol.find({}).toArray()
    let selfBondedSum = 0
    let totalNomimationSum = 0
    for (let i=0;i<allValidators.length;i++) {
      selfBondedSum = selfBondedSum + parseFloat(allValidators[i].selfBonded)
      totalNomimationSum = totalNomimationSum + (parseFloat(allValidators[i].totalNomination) - parseFloat(allValidators[i].selfBonded))
    }
    chainStatus.totalValidatorBonded = selfBondedSum
    chainStatus.totalNominationSum = totalNomimationSum

    // 发行总量
    const totalIssuance = await api.query.balances.totalIssuance()
    chainStatus.pcx_issuance = totalIssuance

    // 届数
    // const trusteeSessctionInfo = await api.rpc.xgatewaycommon.bitcoinTrusteeSessionInfo()
    // const threshold = trusteeSessctionInfo.threshold
    const currentEra = await api.query.xStaking.currentEra()
    chainStatus.vote_cycle = currentEra.toJSON()

    // const balance = await api.query.system.account(address)
    /*
    const col = await getBlockCollection()
    const blocks = await col
      .find({})
      .sort({ 'header.number': -1 })
      .limit(blockSize)
      .toArray()

    const simpleBlocks = blocks.map(block => {
      return {
        hash: block.hash,
        number: block.header.number,
        timestamp: block.blockTime,
        extrinsicsCnt: (block.extrinsics || []).length,
        author: block.author
      }
    })

    if (simpleBlocks.length > 0) {
    */
    io.to(latestChainStatusRoom).emit('latestChainStatus', chainStatus)
    setLatestChainStatus(chainStatus)
  } catch (e) {
    console.error(e)
  } finally {
    setTimeout(feedLatestChainStatus.bind(null, io), FEED_INTERVAL)
  }
}

module.exports = {
  feedLatestChainStatus
}
