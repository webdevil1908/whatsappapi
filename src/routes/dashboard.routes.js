const express = require('express');

const router = express.Router();

const ctrl = require('../controllers/dashboard.controller');


// Login
router.post('/login', ctrl.login);


// Send WhatsApp
router.post('/send-whatsapp', ctrl.sendWhatsApp);


// Dashboard Stats
router.get('/stats', ctrl.getStats);


// Logout
router.post('/logout', ctrl.logout);


module.exports = router;