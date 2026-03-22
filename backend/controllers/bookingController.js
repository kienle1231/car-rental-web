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
      totalPrice,
      customerName,
      customerEmail,
      customerPhone,
      note
    } = req.body;

    const existingBookings = await Booking.find({ car, status: { $in: ['Approved', 'Pending'] } });
    const requestedStart = new Date(pickupDate);
    const requestedEnd = new Date(returnDate);
    const conflict = existingBookings.some((booking) => {
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
      totalPrice,
      customerName,
      customerEmail,
      customerPhone,
      note
    });
    res.status(201).json(booking);
  } catch (error) { res.status(400).json({ error: error.message }); }
};

exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('car');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    
    // Check ownership
    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized access' });
    }
    
    res.json(booking);
  } catch (error) { res.status(500).json({ error: error.message }); }
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

exports.extendBooking = async (req, res) => {
  try {
    const { newReturnDate } = req.body;
    const booking = await Booking.findById(req.params.id).populate('car');

    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.user.toString() !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });

    // Check for conflicts
    const requestedStart = new Date(booking.returnDate);
    const requestedEnd = new Date(newReturnDate);
    
    const approvedBookings = await Booking.find({ 
      car: booking.car._id, 
      status: 'Approved',
      _id: { $ne: booking._id }
    });

    const conflict = approvedBookings.some((b) => {
      return hasOverlap(requestedStart, requestedEnd, new Date(b.pickupDate), new Date(b.returnDate));
    });

    if (conflict) {
      return res.status(409).json({ error: 'Cannot extend. Car is already reserved for those dates.' });
    }

    // Calculate extra price
    const extraDays = Math.ceil((requestedEnd - requestedStart) / (1000 * 60 * 60 * 24));
    const extraPrice = extraDays * booking.car.pricePerDay;

    booking.returnDate = requestedEnd;
    booking.totalPrice += extraPrice;
    await booking.save();

    res.json(booking);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.updateBookingStatus = async (req, res) => {
  try {
    const { status, actualReturnDate } = req.body;
    const booking = await Booking.findById(req.params.id).populate('car');
    
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    booking.status = status;

    if (status === 'Completed') {
      const returnDate = actualReturnDate ? new Date(actualReturnDate) : new Date();
      booking.actualReturnDate = returnDate;

      const scheduledReturn = new Date(booking.returnDate);
      if (returnDate > scheduledReturn) {
        const diffMs = returnDate - scheduledReturn;
        const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
        
        // Penalty: (Price/24) * hours * 1.5
        const hourlyRate = booking.car.pricePerDay / 24;
        booking.lateFee = Math.round(hourlyRate * diffHours * 1.5);
        booking.totalPrice += booking.lateFee;
      }
    }

    await booking.save();
    res.json(booking);
  } catch (error) { res.status(400).json({ error: error.message }); }
};

exports.deleteBooking = async (req, res) => {
  try { await Booking.findByIdAndDelete(req.params.id); res.json({ message: 'Booking deleted' }); }
  catch (error) { res.status(500).json({ error: error.message }); }
};

// Customer cancel own booking
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }
    if (booking.status === 'Completed') {
      return res.status(400).json({ message: 'Cannot cancel a completed booking' });
    }
    if (booking.status === 'Cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }

    const now = new Date();
    const pickup = new Date(booking.pickupDate);
    const diffMs = pickup - now;
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 24 && booking.status === 'Approved') {
      return res.status(400).json({ message: 'Cancellation must be requested at least 24 hours before pickup.' });
    }

    booking.status = 'Cancelled';
    await booking.save();
    res.json(booking);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// Admin complete booking (return car)
exports.completeBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('car');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.status === 'Completed') {
      return res.status(400).json({ message: 'Booking is already completed' });
    }
    if (booking.status === 'Cancelled') {
      return res.status(400).json({ message: 'Cannot complete a cancelled booking' });
    }

    const returnDate = new Date();
    booking.actualReturnDate = returnDate;
    booking.status = 'Completed';

    const scheduledReturn = new Date(booking.returnDate);
    if (returnDate > scheduledReturn) {
      const diffMs = returnDate - scheduledReturn;
      const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
      const hourlyRate = booking.car.pricePerDay / 24;
      booking.lateFee = Math.round(hourlyRate * diffHours * 1.5);
      booking.totalPrice += booking.lateFee;
    }

    await booking.save();
    res.json(booking);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.getStats = async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();
    const allBookings = await Booking.find().populate('car', 'name brand model imageUrl location');

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

    const paidBookings = await Booking.find({ paymentStatus: 'paid' }).populate('car');
    const revenue = paidBookings.reduce((acc, curr) => acc + curr.totalPrice, 0);

    paidBookings.forEach((booking) => {
      const date = new Date(booking.createdAt);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + booking.totalPrice;
    });

    allBookings.forEach((booking) => {
      const location = booking.car?.location || 'Unknown';
      bookingsByLocation[location] = (bookingsByLocation[location] || 0) + 1;

      if (booking.car) {
        const carKey = `${booking.car._id}`;
        if (!topCars[carKey]) {
          topCars[carKey] = {
            count: 0,
            name: booking.car.name,
            brand: booking.car.brand,
            model: booking.car.model,
            imageUrl: booking.car.imageUrl
          };
        }
        topCars[carKey].count += 1;
      }

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
