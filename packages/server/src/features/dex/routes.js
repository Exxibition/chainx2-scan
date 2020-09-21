const Router = require('koa-router')
const dexController = require('./dex.controller')
const orderController = require('./order.controller')
const fillController = require('./fill.controller')

const router = new Router()
router.get('/dex/pairs', dexController.getPairs)
router.get('/dex/orders', orderController.getOpenOrders)
router.get('/dex/fills/:pairId', fillController.getFills)

module.exports = router
