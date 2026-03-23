const express = require('express');
const { createReview, getReviewsByCar, deleteReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.post('/', protect, createReview);          // POST /api/reviews  { bookingId, rating, comment }
router.get('/car/:carId', getReviewsByCar);       // GET  /api/reviews/car/:carId
router.delete('/:id', protect, deleteReview);     // DELETE /api/reviews/:id

module.exports = router;
