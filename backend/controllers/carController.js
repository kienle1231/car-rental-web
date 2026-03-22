const Car = require('../models/Car');
const { calculateDynamicPrice } = require('../utils/pricing');

exports.getCars = async (req, res) => {
  try {
    const { brand, type, minPrice, maxPrice, search, lat, lng, radius } = req.query;
    let query = {};
    if (brand) query.brand = brand;
    if (type) query.type = type;
    if (minPrice || maxPrice) {
      query.pricePerDay = {};
      if (minPrice) query.pricePerDay.$gte = Number(minPrice);
      if (maxPrice) query.pricePerDay.$lte = Number(maxPrice);
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    if (lat && lng) {
      const maxDistance = radius ? Number(radius) * 1000 : 50000; // Default 50km
      const cars = await Car.aggregate([
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
            distanceField: 'calculatedDistance',
            maxDistance: maxDistance,
            spherical: true,
            query: query
          }
        }
      ]);
      return res.json(cars);
    }

    const cars = await Car.find(query);
    res.json(cars);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.getCarById = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    res.json(car);
  } catch (error) { res.status(404).json({ message: 'Car not found' }); }
};

exports.getDynamicPricing = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ message: 'Car not found' });
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'startDate and endDate are required' });
    }
    const pricing = await calculateDynamicPrice(car, new Date(startDate), new Date(endDate));
    res.json(pricing);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// Admin handlers
exports.createCar = async (req, res) => {
  try { const car = await Car.create(req.body); res.status(201).json(car); }
  catch (error) { res.status(400).json({ error: error.message }); }
};

exports.updateCar = async (req, res) => {
  try {
    const car = await Car.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(car);
  } catch (error) { res.status(400).json({ error: error.message }); }
};

exports.deleteCar = async (req, res) => {
  try { await Car.findByIdAndDelete(req.params.id); res.json({ message: 'Car removed' }); }
  catch (error) { res.status(500).json({ error: error.message }); }
};
