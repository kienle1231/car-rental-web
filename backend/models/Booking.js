const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  car: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
  pickupDate: { type: Date, required: true },
  returnDate: { type: Date, required: true },
  pickupLocation: { type: String, required: true },
  pickupLocationCoords: {
    lat: { type: Number },
    lng: { type: Number }
  },
  dropoffLocationCoords: {
    lat: { type: Number },
    lng: { type: Number }
  },
  distanceKm: { type: Number, default: 0 },
  addOns: { type: [String], default: [] },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  paymentMethod: { type: String, default: 'card' },
  transactionId: { type: String },
  totalPrice: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Completed', 'Cancelled'], default: 'Pending' },
}, { timestamps: true });

module.exports = mongoose.model('Booking', BookingSchema);
