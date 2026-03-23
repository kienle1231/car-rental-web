const express = require('express');
const {
  getMyNotifications, markRead, markAllRead,
  createVoucher, getVouchers, deleteVoucher, applyVoucher,
  getAnalytics
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');
const router = express.Router();

// Notifications (any logged-in user)
router.get('/notifications/my', protect, getMyNotifications);
router.put('/notifications/read-all', protect, markAllRead);
router.put('/notifications/:id/read', protect, markRead);

// Vouchers — apply is public (user), manage is admin-only
router.post('/vouchers/apply', protect, applyVoucher);
router.get('/vouchers', protect, adminOnly, getVouchers);
router.post('/vouchers', protect, adminOnly, createVoucher);
router.delete('/vouchers/:id', protect, adminOnly, deleteVoucher);

// Analytics
router.get('/analytics', protect, adminOnly, getAnalytics);  // ?period=day|month

module.exports = router;
