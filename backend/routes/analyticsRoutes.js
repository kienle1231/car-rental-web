const express = require('express');
const { getPricingSurges } = require('../controllers/analyticsController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/pricing-surges', protect, adminOnly, getPricingSurges);

module.exports = router;
