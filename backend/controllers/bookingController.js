const Booking = require('../models/Booking');

const hasOverlap = (startA, endA, startB, endB) => {
  return startA <= endB && endA >= startB;
};

exports.createBooking = async (req, res) => {
  try {
    const {
      car,
      pickupDate,
      returnDate,
      pickupLocation,
      pickupLocationCoords,
      dropoffLocationCoords,
      distanceKm,
      addOns,
      paymentStatus,
      paymentMethod,
      transactionId,
      totalPrice
    } = req.body;

    const approvedBookings = await Booking.find({ car, status: 'Approved' });
    const requestedStart = new Date(pickupDate);
    const requestedEnd = new Date(returnDate);
    const conflict = approvedBookings.some((booking) => {
      return hasOverlap(requestedStart, requestedEnd, new Date(booking.pickupDate), new Date(booking.returnDate));
    });

    if (conflict) {
      return res.status(409).json({ error: 'Car is unavailable for the selected dates.' });
    }

    const booking = await Booking.create({
      user: req.user.id,
      car,
      pickupDate,
      returnDate,
      pickupLocation,
      pickupLocationCoords,
      dropoffLocationCoords,
      distanceKm,
      addOns,
      paymentStatus,
      paymentMethod,
      transactionId,
      totalPrice
    });
    res.status(201).json(booking);
  } catch (error) { res.status(400).json({ error: error.message }); }
};

exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id }).populate('car');
    res.json(bookings);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.getAvailabilityByCar = async (req, res) => {
  try {
    const bookings = await Booking.find({
      car: req.params.carId,
      status: { $in: ['Approved', 'Completed'] }
    }).select('pickupDate returnDate status');
    res.json(bookings);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.getAvailabilityCalendar = async (req, res) => {
  try {
    const bookings = await Booking.find({ status: { $in: ['Approved', 'Completed'] } })
      .populate('car', 'name brand imageUrl')
      .select('pickupDate returnDate status car');
    res.json(bookings);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// Admin handlers
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().populate('user', 'name email').populate('car', 'name brand location');
    res.json(bookings);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.updateBookingStatus = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id, { status: req.body.status }, { new: true }
    );
    res.json(booking);
  } catch (error) { res.status(400).json({ error: error.message }); }
};

exports.deleteBooking = async (req, res) => {
  try { await Booking.findByIdAndDelete(req.params.id); res.json({ message: 'Booking deleted' }); }
  catch (error) { res.status(500).json({ error: error.message }); }
};

exports.getStats = async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();
    const completedBookings = await Booking.find({ status: 'Completed' }).populate('car', 'name brand model imageUrl location');
    const allBookings = await Booking.find().populate('car', 'name brand model imageUrl location');
    const revenue = completedBookings.reduce((acc, curr) => acc + curr.totalPrice, 0);

    const User = require('../models/User');
    const Car = require('../models/Car');
    const totalUsers = await User.countDocuments();
    const totalCars = await Car.countDocuments();

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const revenueByMonth = {};
    const bookingsByLocation = {};
    const topCars = {};
    const bookingStatusStats = { Pending: 0, Approved: 0, Completed: 0, Cancelled: 0 };

    completedBookings.forEach((booking) => {
      const date = new Date(booking.createdAt);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + booking.totalPrice;
    });

    allBookings.forEach((booking) => {
      const location = booking.car?.location || 'Unknown';
      bookingsByLocation[location] = (bookingsByLocation[location] || 0) + 1;

      const carKey = booking.car?._id ? `${booking.car._id}` : 'unknown';
      if (!topCars[carKey]) {
        topCars[carKey] = {
          count: 0,
          name: booking.car?.name || 'Unknown',
          brand: booking.car?.brand || 'Unknown',
          model: booking.car?.model || '',
          imageUrl: booking.car?.imageUrl || ''
        };
      }
      topCars[carKey].count += 1;

      if (bookingStatusStats[booking.status] !== undefined) {
        bookingStatusStats[booking.status] += 1;
      }
    });

    const activeUsers = await Booking.distinct('user');
    const newUsersThisMonth = await User.countDocuments({ createdAt: { $gte: monthStart } });

    res.json({
      totalBookings,
      totalUsers,
      totalCars,
      revenue,
      monthlyRevenue: revenueByMonth,
      bookingsByLocation,
      topCars: Object.values(topCars).sort((a, b) => b.count - a.count).slice(0, 6),
      activeUsers: activeUsers.length,
      newUsersThisMonth,
      bookingStatusStats
    });
  } catch (error) { res.status(500).json({ error: error.message }); }
};
