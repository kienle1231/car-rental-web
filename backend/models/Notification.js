const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  type: { type: String, enum: ['booking', 'payment', 'reminder', 'system'], default: 'system' },
  isRead: { type: Boolean, default: false },
  relatedId: { type: String } // bookingId or carId for deep linking
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
