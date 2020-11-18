const { getDb } = require('../../services/mongo')

class DexController {
  async getPairs(ctx) {
    const db = await getDb()
    const col = await db.collection('pairs')

    const items = await col
      .find({})
      .sort({ blockHeight: -1 })
      .limit(1)
      .toArray()
    ctx.body = items.length <= 0 ? [] : items[0].pairs
  }
  async getTradingPairs(ctx) {
    const db = await getDb()
    const col = await db.collection('deals')
    const items = await col
      .find({})
      .sort()
      .toArray()
    let latestTransactionPrices = items[items.length - 1].price
    let week = 604800000
    let day = 86400000
    const currentTime = new Date().getTime()
    const weekMod = currentTime % week
    const dayMod = currentTime % day
    let dayStartTime = currentTime - dayMod
    let dayEndTime = dayStartTime - day
    let weekStartTime = currentTime - weekMod
    let weekEndTime = weekStartTime - week
    const weekItems = await col
      .find({
        $and: [
          { blockTime: { $gte: weekEndTime } },
          { blockTime: { $lte: weekStartTime } }
        ]
      })
      .sort()
      .toArray()

    const dayItems = await col
      .find({
        $and: [
          { blockTime: { $gte: dayEndTime } },
          { blockTime: { $lte: dayStartTime } }
        ]
      })
      .sort()
      .toArray()
    let TransactionsWeekNumber = weekItems.length
    let TransactionsDayNumber = dayItems.length
    ctx.body = {
      latestTransactionPrices,
      TransactionsWeekNumber,
      TransactionsDayNumber
    }
  }
}

module.exports = new DexController()
