const Review = require('../models/Review');
const Booking = require('../models/Booking');

// POST /api/reviews — Create review (only if user completed a booking for this car)
exports.createReview = async (req, res) => {
  try {
    const { car, rating, comment } = req.body;
    const userId = req.user.id;

    // Check if user already reviewed this car
    const existingReview = await Review.findOne({ user: userId, car });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this car.' });
    }

    // Check if user has a completed booking for this car
    const completedBooking = await Booking.findOne({
      user: userId,
      car,
      status: 'Completed'
    });
    if (!completedBooking) {
      return res.status(403).json({ message: 'You can only review cars from completed bookings.' });
    }

    const review = await Review.create({ user: userId, car, rating, comment });
    const populated = await Review.findById(review._id).populate('user', 'name email');

    // Update car average rating
    const CarModel = require('../models/Car');
    const allReviews = await Review.find({ car });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await CarModel.findByIdAndUpdate(car, { rating: Math.round(avgRating * 10) / 10 });

    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// GET /api/reviews/car/:carId — Get all reviews for a car
exports.getReviewsByCar = async (req, res) => {
  try {
    const reviews = await Review.find({ car: req.params.carId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    // Calculate stats
    const count = reviews.length;
    const avgRating = count > 0
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / count) * 10) / 10
      : 0;

    res.json({ reviews, stats: { count, avgRating } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/reviews/:id — Delete own review
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    // Only owner or admin can delete
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }

    const carId = review.car;
    await Review.findByIdAndDelete(req.params.id);

    // Recalculate car average rating
    const CarModel = require('../models/Car');
    const remaining = await Review.find({ car: carId });
    const avgRating = remaining.length > 0
      ? Math.round((remaining.reduce((sum, r) => sum + r.rating, 0) / remaining.length) * 10) / 10
      : 5.0;
    await CarModel.findByIdAndUpdate(carId, { rating: avgRating });

    res.json({ message: 'Review deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
