const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/client.controller');
router.post('/add', ctrl.addClient);
router.get('/list', ctrl.listClients);
module.exports = router;