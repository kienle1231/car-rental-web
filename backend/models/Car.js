const mongoose = require('mongoose');

const CarSchema = new mongoose.Schema({
  name: { type: String, required: true },
  brand: { type: String, required: true },
  model: { type: String },
  year: { type: Number },
  pricePerDay: { type: Number, required: true },
  type: { type: String, required: true }, // SUV, Sedan, Sports, etc.
  description: { type: String, required: true },
  location: { type: String },
  pickupLocationCoords: {
    lat: { type: Number },
    lng: { type: Number }
  },
  imageUrl: { type: String, required: true },
  galleryImages: { type: [String], default: [] },
  car3dModel: { type: String },
  availability: { type: Boolean, default: true },
  rating: { type: Number, default: 5.0 },
  seats: { type: Number, required: true },
  transmission: { type: String, required: true }, // Auto, Manual
  fuelType: { type: String, required: true }, // Electric, Gas, Hybrid
}, { timestamps: true });

module.exports = mongoose.model('Car', CarSchema);
