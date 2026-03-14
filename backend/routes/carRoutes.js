const express = require('express');
const { getCars, getCarById, createCar, updateCar, deleteCar, getDynamicPricing } = require('../controllers/carController');
const { protect, adminOnly } = require('../middleware/auth');
const router = express.Router();

router.route('/')
  .get(getCars)
  .post(protect, adminOnly, createCar);

router.route('/:id')
  .get(getCarById)
  .put(protect, adminOnly, updateCar)
  .delete(protect, adminOnly, deleteCar);

router.get('/:id/pricing', getDynamicPricing);

module.exports = router;
