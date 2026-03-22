const express = require('express');
const { confirmPayment } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.post('/confirm', protect, confirmPayment);

module.exports = router;
