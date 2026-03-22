const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const User = require('./models/User');
const Car = require('./models/Car');
require('dotenv').config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const users = await User.find();
    const cars = await Car.find();

    if (users.length === 0 || cars.length === 0) {
      console.log('Must have users and cars to seed bookings.');
      process.exit(1);
    }

    // Historical data for 6 months
    const now = new Date();
    const bookings = [];

    for (let i = 0; i < 150; i++) {
       const user = users[Math.floor(Math.random() * users.length)];
       const car = cars[Math.floor(Math.random() * cars.length)];
       
       // Random date in last 180 days
       const daysAgo = Math.floor(Math.random() * 180);
       const pickupDate = new Date(now);
       pickupDate.setDate(now.getDate() - daysAgo);
       
       const returnDate = new Date(pickupDate);
       returnDate.setDate(pickupDate.getDate() + Math.floor(Math.random() * 5) + 1);

       const statusOptions = ['Completed', 'Completed', 'Completed', 'Approved', 'Cancelled', 'Pending'];
       const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];

       bookings.push({
         user: user._id,
         car: car._id,
         pickupDate,
         returnDate,
         pickupLocation: car.location || 'Hà Nội',
         totalPrice: car.pricePerDay * (Math.floor(Math.random() * 5) + 1),
         paymentStatus: status === 'Completed' || status === 'Approved' ? 'paid' : 'pending',
         paymentMethod: ['card', 'vietqr', 'apple'][Math.floor(Math.random() * 3)],
         status,
         customerName: user.name,
         customerEmail: user.email,
         customerPhone: '0981313' + Math.floor(Math.random() * 999),
         createdAt: pickupDate // Match creation to pickup for chart logic
       });
    }

    await Booking.insertMany(bookings);
    console.log('Successfully seeded 150 bookings into MongoDB!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seedData();
