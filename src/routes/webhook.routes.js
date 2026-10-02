const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/webhook.controller');
router.get('/', ctrl.verify);
router.post('/', ctrl.receive);
module.exports = router;