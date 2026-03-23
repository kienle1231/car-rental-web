const mongoose = require('mongoose');

const VoucherSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  discount: { type: Number, required: true, min: 1, max: 100 }, // percentage
  expiryDate: { type: Date, required: true },
  usageLimit: { type: Number, default: 100 },
  usedCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  minBookingValue: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Voucher', VoucherSchema);
