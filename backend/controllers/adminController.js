const Notification = require('../models/Notification');
const Voucher = require('../models/Voucher');
const Booking = require('../models/Booking');

// ──────────────────────── NOTIFICATIONS ────────────────────────────────────────

// GET /api/admin/notifications/my  → user's own notifications
exports.getMyNotifications = async (req, res) => {
  try {
    const notifs = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(50);
    res.json(notifs);
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// PUT /api/admin/notifications/:id/read
exports.markRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, { isRead: true });
    res.json({ message: 'Marked as read' });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// PUT /api/admin/notifications/read-all
exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user.id, isRead: false }, { isRead: true });
    res.json({ message: 'All marked as read' });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// Internal helper: push a notification
exports.pushNotification = async (userId, title, body, type = 'system', relatedId = null) => {
  try {
    await Notification.create({ user: userId, title, body, type, relatedId });
  } catch (_) {}
};

// ──────────────────────── VOUCHERS ─────────────────────────────────────────────

// POST /api/admin/vouchers  (admin only)
exports.createVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.create(req.body);
    res.status(201).json(voucher);
  } catch (e) { res.status(400).json({ error: e.message }); }
};

// GET /api/admin/vouchers  (admin only)
exports.getVouchers = async (req, res) => {
  try {
    res.json(await Voucher.find().sort({ createdAt: -1 }));
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// DELETE /api/admin/vouchers/:id
exports.deleteVoucher = async (req, res) => {
  try {
    await Voucher.findByIdAndDelete(req.params.id);
    res.json({ message: 'Voucher deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// POST /api/admin/vouchers/apply  (public — user applies code)
// Body: { code, bookingValue }
// Returns: { discount, finalPrice }
exports.applyVoucher = async (req, res) => {
  try {
    const { code, bookingValue } = req.body;
    const voucher = await Voucher.findOne({ code: code.toUpperCase() });
    if (!voucher || !voucher.isActive) return res.status(404).json({ message: 'Invalid voucher code' });
    if (new Date() > voucher.expiryDate) return res.status(400).json({ message: 'Voucher has expired' });
    if (voucher.usedCount >= voucher.usageLimit) return res.status(400).json({ message: 'Voucher usage limit reached' });
    if (bookingValue < voucher.minBookingValue) return res.status(400).json({ message: `Minimum booking value: $${voucher.minBookingValue}` });

    const discountAmount = Math.round(bookingValue * (voucher.discount / 100) * 100) / 100;
    const finalPrice = Math.round((bookingValue - discountAmount) * 100) / 100;

    res.json({ code: voucher.code, discount: voucher.discount, discountAmount, finalPrice });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// ──────────────────────── ANALYTICS ────────────────────────────────────────────

// GET /api/admin/analytics?period=day|month
exports.getAnalytics = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const groupFormat = period === 'day'
      ? { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
      : { $dateToString: { format: '%Y-%m', date: '$createdAt' } };

    const revenueData = await Booking.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: groupFormat, revenue: { $sum: '$totalPrice' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $limit: period === 'day' ? 30 : 12 }
    ]);

    res.json({ period, data: revenueData });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
