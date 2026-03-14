const Car = require('../models/Car');
const { calculateDynamicPrice } = require('./pricing');

const calculatePricingSurges = async () => {
  const cars = await Car.find();
  const today = new Date();
  const startDate = new Date(today);
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 2);

  const surges = await Promise.all(
    cars.map(async (car) => {
      const pricing = await calculateDynamicPrice(car, startDate, endDate);
      const basePrice = pricing.basePrice;
      const dynamicPrice = pricing.dynamicPricePerDay;
      const surgePercentage = basePrice ? ((dynamicPrice - basePrice) / basePrice) * 100 : 0;
      return {
        carId: car._id,
        brand: car.brand,
        model: car.model || car.name,
        image: car.imageUrl,
        basePrice,
        dynamicPrice,
        surgePercentage: Number(surgePercentage.toFixed(1))
      };
    })
  );

  return surges.sort((a, b) => b.surgePercentage - a.surgePercentage).slice(0, 5);
};

module.exports = { calculatePricingSurges };