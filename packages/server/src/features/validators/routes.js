const Router = require('koa-router')
const validatorsController = require('./validator.controller')

const router = new Router()
router.get('/validators', validatorsController.getValidators)
router.get('/unsettled', validatorsController.getUnsettledNodes)
router.get('/trustees', validatorsController.getTrusteeNodes)
router.get('/missed', validatorsController.getMissed)
router.get('/validators/all', validatorsController.getValidatorInfo)

module.exports = router
