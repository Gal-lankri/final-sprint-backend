const express = require('express')
const {requireAuth, requireAdmin} = require('../../middlewares/requireAuth.middleware')
const {log} = require('../../middlewares/logger.middleware')
const {addActivity, getActivitys, deleteActivity} = require('./activity.controller')
const router = express.Router()

// middleware that is specific to this router
// router.use(requireAuth)

router.get('/', log, getActivitys)
router.post('/',  log, requireAuth, addActivity)
router.delete('/:id',  requireAuth, deleteActivity)

module.exports = router