const express = require('express');
const {
  createBooking,
  getMyBookings,
  getAllBookings,
  updateBookingStatus,
  deleteBooking,
  getStats,
  getAvailabilityByCar,
  getAvailabilityCalendar
} = require('../controllers/bookingController');
const { protect, adminOnly } = require('../middleware/auth');
const router = express.Router();

// Public/Customer Routes
router.post('/', protect, createBooking);
router.get('/my-bookings', protect, getMyBookings);
router.get('/availability/:carId', getAvailabilityByCar);

// Admin Routes
router.get('/admin/stats', protect, adminOnly, getStats);
router.get('/admin/availability', protect, adminOnly, getAvailabilityCalendar);
router.get('/admin', protect, adminOnly, getAllBookings);
router.put('/admin/:id', protect, adminOnly, updateBookingStatus);
router.delete('/admin/:id', protect, adminOnly, deleteBooking);

module.exports = router;
