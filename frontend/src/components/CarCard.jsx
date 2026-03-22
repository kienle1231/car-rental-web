import { motion } from 'framer-motion';
import { Star, MapPin, Users, Fuel, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

const CarCard = ({ car }) => {
  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 260 }}
      className="relative group bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden hover:border-yellow-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-yellow-500/15"
    >
      <div className="relative h-56 overflow-hidden">
        <img
          src={car.imageUrl}
          alt={car.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
        <div className="absolute top-3 right-3 bg-yellow-400 text-black text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
          <Star className="w-3 h-3" fill="currentColor" /> {car.rating}
        </div>
        <div className="absolute bottom-3 left-3">
          <span className="bg-white/20 backdrop-blur px-3 py-1 rounded-full text-xs font-medium text-white">{car.type}</span>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="text-xl font-bold text-white">{car.brand} {car.model}</h3>
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5" /> 
              {car.calculatedDistance ? <span className="text-yellow-400 font-bold bg-yellow-400/10 px-2 py-0.5 rounded-full">{(car.calculatedDistance / 1000).toFixed(1)} km from you</span> : (car.location || 'Global Hub')}
            </p>
          </div>
          <span className="text-xs text-gray-400">{car.year}</span>
        </div>

        <p className="text-gray-500 text-xs mb-5 line-clamp-2">{car.description}</p>

        <div className="flex items-center gap-4 text-xs text-gray-400 mb-5">
          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {car.seats}</span>
          <span className="flex items-center gap-1"><Settings className="w-3.5 h-3.5" /> {car.transmission}</span>
          <span className="flex items-center gap-1"><Fuel className="w-3.5 h-3.5" /> {car.fuelType}</span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="text-2xl font-extrabold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">${car.pricePerDay}</span>
            <span className="text-xs text-gray-500">/day</span>
          </div>
          <div className="flex items-center gap-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all">
            <Link to={`/cars/${car._id}`} className="border border-white/15 text-white px-4 py-2 rounded-full text-xs font-semibold hover:bg-white/10 transition-all">
              View Details
            </Link>
            <Link to={`/cars/${car._id}`} className="bg-gradient-to-r from-yellow-400 to-amber-500 text-black px-5 py-2 rounded-full text-xs font-bold hover:shadow-lg hover:shadow-yellow-500/30 transition-all">
              Book Now
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CarCard;
