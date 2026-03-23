const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  car: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, required: true },
}, { timestamps: true });

// One review per booking
ReviewSchema.index({ booking: 1 }, { unique: true });

// Auto-update car average rating after save/delete
const updateCarRating = async (carId) => {
  const Review = mongoose.model('Review');
  const Car = require('./Car');
  const stats = await Review.aggregate([
    { $match: { car: new mongoose.Types.ObjectId(carId) } },
    { $group: { _id: '$car', avgRating: { $avg: '$rating' } } }
  ]);
  const avg = stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 5.0;
  await Car.findByIdAndUpdate(carId, { rating: avg });
};

ReviewSchema.post('save', function () { updateCarRating(this.car); });
ReviewSchema.post('findOneAndDelete', function (doc) { if (doc) updateCarRating(doc.car); });

module.exports = mongoose.model('Review', ReviewSchema);
