const mongoose = require('mongoose');
require('dotenv').config();
const Car = require('./models/Car');

const cityCoords = {
  'Hà Nội': { lat: 21.0285, lng: 105.8542 },
  'TP. Hồ Chí Minh': { lat: 10.8231, lng: 106.6297 },
  'Đà Nẵng': { lat: 16.0544, lng: 108.2022 },
  'Cần Thơ': { lat: 10.0452, lng: 105.7469 },
  'Hải Phòng': { lat: 20.8449, lng: 106.6881 },
  'Nha Trang (Khánh Hòa)': { lat: 12.2388, lng: 109.1967 },
  'Đà Lạt (Lâm Đồng)': { lat: 11.9404, lng: 108.4583 },
  'Hạ Long (Quảng Ninh)': { lat: 20.9599, lng: 107.0866 },
  'Huế': { lat: 16.4637, lng: 107.5909 },
  'Vũng Tàu': { lat: 10.3460, lng: 107.0843 }
};

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const cars = await Car.find();
  for (let car of cars) {
    const base = cityCoords[car.location] || cityCoords['Hà Nội'];
    
    // add small random offset (~ up to 5km radius)
    // 0.01 deg is roughly 1km
    const randomOffsetLat = (Math.random() - 0.5) * 0.05;
    const randomOffsetLng = (Math.random() - 0.5) * 0.05;

    const lat = base.lat + randomOffsetLat;
    const lng = base.lng + randomOffsetLng;

    car.pickupLocationCoords = { lat, lng };
    car.locationGeo = {
      type: 'Point',
      coordinates: [lng, lat] // Must be Longitude, Latitude for GeoJSON
    };
    
    await car.save();
  }
  console.log('Coordinates seeded successfully!');
  process.exit(0);
}).catch(console.error);
