import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Calendar, MapPin, CreditCard } from 'lucide-react';

const BookingConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { booking, carSnapshot, addOnsTotal, days } = location.state || {};

  if (!booking || !carSnapshot) {
    navigate('/');
    return null;
  }

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/10 border border-white/20 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-3xl bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Booking confirmed</p>
                <h1 className="text-3xl font-black">Your ride is secured</h1>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/my-bookings')}
              className="bg-gradient-to-r from-yellow-400 to-amber-500 text-black px-6 py-3 rounded-full font-bold"
            >
              View My Bookings
            </motion.button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] gap-8 mt-10">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <img src={carSnapshot.imageUrl} alt={carSnapshot.name} className="w-24 h-20 rounded-2xl object-cover" />
                <div>
                  <p className="text-sm text-gray-400">{carSnapshot.brand} {carSnapshot.model}</p>
                  <h2 className="text-xl font-bold">{carSnapshot.name}</h2>
                  <p className="text-sm text-gray-500">Booking ID: {booking._id}</p>
                </div>
              </div>

              <div className="space-y-3 text-sm text-gray-300">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Dates</span>
                  <span>{booking.pickupDate?.split('T')[0]} → {booking.returnDate?.split('T')[0]}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Pickup</span>
                  <span>{booking.pickupLocationCoords?.lat?.toFixed(3)}, {booking.pickupLocationCoords?.lng?.toFixed(3)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Dropoff</span>
                  <span>{booking.dropoffLocationCoords?.lat?.toFixed(3)}, {booking.dropoffLocationCoords?.lng?.toFixed(3)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><CreditCard className="w-4 h-4" /> Payment</span>
                  <span className="text-green-400 uppercase">{booking.paymentStatus}</span>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <p className="text-sm text-gray-400 mb-3">Add-ons</p>
                <div className="text-sm text-gray-300">
                  {booking.addOns?.length ? booking.addOns.join(', ') : 'None'}
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-400">Transaction ID</p>
                <p className="text-lg font-semibold">{booking.transactionId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Total paid</p>
                <p className="text-2xl font-black text-yellow-400">${booking.totalPrice}</p>
                <p className="text-xs text-gray-500">({days} days, add-ons ${addOnsTotal})</p>
              </div>
              <div className="bg-green-500/10 border border-green-400/20 rounded-2xl px-4 py-3 text-sm text-green-300">Payment successful</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BookingConfirmation;
