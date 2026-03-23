const Review = require('../models/Review');
const Booking = require('../models/Booking');

// ─── CREATE REVIEW ────────────────────────────────────────────────────────────
// POST /api/reviews
// Body: { bookingId, rating, comment }
// Header: Authorization: Bearer <token>
// Rule: Only allowed if booking.status === 'Completed' AND user owns booking
exports.createReview = async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body;

    // 1. Validate booking exists and belongs to user
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.user.toString() !== req.user.id)
      return res.status(403).json({ message: 'You can only review your own bookings' });

    // 2. Only allow review if booking is completed
    if (booking.status !== 'Completed')
      return res.status(400).json({ message: 'You can only review completed bookings' });

    // 3. Check duplicate (unique index on booking)
    const existing = await Review.findOne({ booking: bookingId });
    if (existing) return res.status(400).json({ message: 'You already reviewed this booking' });

    const review = await Review.create({
      user: req.user.id,
      car: booking.car,
      booking: bookingId,
      rating,
      comment
    });

    // Car rating is auto-updated via post-save hook in Review model

    res.status(201).json(review);
  } catch (error) { res.status(400).json({ error: error.message }); }
};

// ─── GET REVIEWS BY CAR ───────────────────────────────────────────────────────
// GET /api/reviews/car/:carId
exports.getReviewsByCar = async (req, res) => {
  try {
    const reviews = await Review.find({ car: req.params.carId })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    const count = reviews.length;
    const avgRating = count > 0
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10
      : 0;

    res.json({ stats: { count, avgRating }, reviews });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// ─── DELETE REVIEW ────────────────────────────────────────────────────────────
// DELETE /api/reviews/:id
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    const isOwner = review.user.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Not authorized' });

    await Review.findByIdAndDelete(req.params.id);
    res.json({ message: 'Review deleted' });
  } catch (error) { res.status(500).json({ error: error.message }); }
};
