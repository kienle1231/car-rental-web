const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('./models/User');

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const adminName = 'anhhaikien';
    const adminEmail = 'anhhaikien@luxeride.com';
    const adminPass = 'kien2004';

    const exists = await User.findOne({ email: adminEmail });
    if (exists) {
      console.log('Admin user with this email already exists.');
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(adminPass, 10);
    
    const admin = await User.create({
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      status: 'Active'
    });

    console.log('Admin user created successfully!');
    console.log('Email:', admin.email);
    console.log('Password:', adminPass);
    console.log('Role:', admin.role);

    process.exit(0);
  } catch (err) {
    console.error('Error creating admin:', err.message);
    process.exit(1);
  }
};

createAdmin();
