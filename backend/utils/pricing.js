const Booking = require('../models/Booking');

const luxuryBrands = ['Tesla', 'BMW', 'Mercedes', 'Mercedes-Benz', 'Audi', 'Porsche', 'Lexus'];

const getDayOfWeekMultiplier = (date) => {
  const day = date.getDay();
  if (day === 6 || day === 0) return 1.15; // Sat/Sun
  if (day === 5) return 1.1; // Fri
  return 1;
};

const enumerateDays = (start, end) => {
  const dates = [];
  const current = new Date(start);
  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
};

const calculateAvailabilityPressure = async (carId, startDate) => {
  const monthStart = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const monthEnd = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
  const totalDays = monthEnd.getDate();

  const bookings = await Booking.find({
    car: carId,
    status: { $in: ['Approved', 'Completed'] },
    pickupDate: { $lte: monthEnd },
    returnDate: { $gte: monthStart }
  }).select('pickupDate returnDate');

  const bookedDays = new Set();
  bookings.forEach((booking) => {
    const start = new Date(Math.max(booking.pickupDate, monthStart));
    const end = new Date(Math.min(booking.returnDate, monthEnd));
    enumerateDays(start, end).forEach((date) => bookedDays.add(date.toISOString().split('T')[0]));
  });

  const availability = 1 - bookedDays.size / totalDays;
  if (availability < 0.2) return { multiplier: 1.2, availability };
  if (availability < 0.4) return { multiplier: 1.1, availability };
  return { multiplier: 1, availability };
};

const calculateDynamicPrice = async (car, startDate, endDate) => {
  const basePrice = car.pricePerDay;
  const dateRange = enumerateDays(startDate, endDate);
  const dayMultiplier = dateRange.reduce((acc, date) => acc + getDayOfWeekMultiplier(date), 0) / dateRange.length;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentBookings = await Booking.countDocuments({
    car: car._id,
    status: { $in: ['Approved', 'Completed'] },
    pickupDate: { $gte: thirtyDaysAgo }
  });

  const demandMultiplier = recentBookings >= 6 ? 1.2 : recentBookings >= 3 ? 1.1 : 1;

  const { multiplier: availabilityMultiplier, availability } = await calculateAvailabilityPressure(car._id, startDate);

  const tierMultiplier = luxuryBrands.includes(car.brand) ? 1.1 : 1;

  const leadDays = Math.ceil((startDate - new Date()) / 86400000);
  const leadMultiplier = leadDays <= 3 ? 1.15 : leadDays <= 7 ? 1.1 : 1;

  const combinedMultiplier = dayMultiplier * demandMultiplier * availabilityMultiplier * tierMultiplier * leadMultiplier;
  const dynamicPricePerDay = Math.round(basePrice * combinedMultiplier);
  const totalPrice = dynamicPricePerDay * dateRange.length;

  return {
    basePrice,
    dynamicPricePerDay,
    totalPrice,
    priceBreakdown: {
      dayOfWeekMultiplier: Number(dayMultiplier.toFixed(2)),
      demandMultiplier,
      availabilityMultiplier,
      tierMultiplier,
      leadTimeMultiplier: leadMultiplier,
      availability
    },
    demandIndicators: {
      highDemand: demandMultiplier > 1,
      limitedAvailability: availabilityMultiplier > 1,
      popularCar: recentBookings >= 3
    }
  };
};

module.exports = { calculateDynamicPrice };