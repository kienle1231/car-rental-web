const express = require('express');
const { createReview, getReviewsByCar, deleteReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.post('/', protect, createReview);
router.get('/car/:carId', getReviewsByCar);
router.delete('/:id', protect, deleteReview);

module.exports = router;
