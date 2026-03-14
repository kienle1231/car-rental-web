import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, Lock, Calendar, MapPin, ShieldCheck } from 'lucide-react';
import { createBookingAPI } from '../services/api';
import toast from 'react-hot-toast';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [processing, setProcessing] = useState(false);
  const [form, setForm] = useState({
    cardNumber: '',
    expiry: '',
    cvc: '',
    cardholder: ''
  });

  const checkoutPayload = useMemo(() => {
    if (location.state) return location.state;
    const cached = sessionStorage.getItem('checkoutPayload');
    return cached ? JSON.parse(cached) : null;
  }, [location.state]);

  useEffect(() => {
    if (!checkoutPayload) {
      navigate('/cars');
    }
  }, [checkoutPayload, navigate]);

  const handlePayment = async (event) => {
    event.preventDefault();
    if (!checkoutPayload) return;
    if (!form.cardNumber || !form.expiry || !form.cvc || !form.cardholder) {
      toast.error('Please fill all payment fields');
      return;
    }

    setProcessing(true);
    try {
      const transactionId = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const payload = {
        ...checkoutPayload.booking,
        car: checkoutPayload.carId,
        paymentStatus: 'paid',
        paymentMethod: 'card',
        transactionId
      };
      const { data } = await createBookingAPI(payload);
      sessionStorage.removeItem('checkoutPayload');
      navigate('/booking-confirmation', {
        state: {
          booking: data,
          carSnapshot: checkoutPayload.carSnapshot,
          addOnsTotal: checkoutPayload.addOnsTotal,
          days: checkoutPayload.days
        }
      });
    } catch (error) {
      toast.error('Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (!checkoutPayload) return null;

  const { booking, carSnapshot, addOnsTotal, days } = checkoutPayload;

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/10 border border-white/20 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-yellow-400/15 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Secure Payment</p>
              <h1 className="text-2xl font-black">Complete your booking</h1>
            </div>
          </div>

          <form onSubmit={handlePayment} className="space-y-5">
            <div>
              <label className="text-sm text-gray-400">Card Number</label>
              <div className="mt-2 flex items-center gap-3 bg-white/10 border border-white/20 rounded-2xl px-4 py-3">
                <CreditCard className="w-5 h-5 text-yellow-400" />
                <input
                  value={form.cardNumber}
                  onChange={(e) => setForm({ ...form, cardNumber: e.target.value })}
                  placeholder="1234 5678 9012 3456"
                  className="bg-transparent w-full text-sm text-white placeholder:text-gray-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400">Expiry Date</label>
                <div className="mt-2 flex items-center gap-3 bg-white/10 border border-white/20 rounded-2xl px-4 py-3">
                  <Calendar className="w-5 h-5 text-yellow-400" />
                  <input
                    value={form.expiry}
                    onChange={(e) => setForm({ ...form, expiry: e.target.value })}
                    placeholder="MM/YY"
                    className="bg-transparent w-full text-sm text-white placeholder:text-gray-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-400">CVC</label>
                <div className="mt-2 flex items-center gap-3 bg-white/10 border border-white/20 rounded-2xl px-4 py-3">
                  <Lock className="w-5 h-5 text-yellow-400" />
                  <input
                    value={form.cvc}
                    onChange={(e) => setForm({ ...form, cvc: e.target.value })}
                    placeholder="123"
                    className="bg-transparent w-full text-sm text-white placeholder:text-gray-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-400">Cardholder Name</label>
              <div className="mt-2 flex items-center gap-3 bg-white/10 border border-white/20 rounded-2xl px-4 py-3">
                <ShieldCheck className="w-5 h-5 text-yellow-400" />
                <input
                  value={form.cardholder}
                  onChange={(e) => setForm({ ...form, cardholder: e.target.value })}
                  placeholder="Name on card"
                  className="bg-transparent w-full text-sm text-white placeholder:text-gray-500 focus:outline-none"
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              disabled={processing}
              className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 text-black py-4 rounded-2xl font-bold text-lg shadow-lg shadow-yellow-500/25 hover:shadow-yellow-500/40 transition disabled:opacity-60"
            >
              {processing ? 'Processing...' : 'Pay & Confirm Booking'}
            </motion.button>
          </form>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
          <div className="flex items-center gap-4 mb-6">
            <img src={carSnapshot.imageUrl} alt={carSnapshot.name} className="w-20 h-16 rounded-2xl object-cover" />
            <div>
              <p className="text-xs text-gray-400">{carSnapshot.brand} {carSnapshot.model}</p>
              <h3 className="text-lg font-bold">{carSnapshot.name}</h3>
              <p className="text-xs text-gray-500">${carSnapshot.pricePerDay}/day</p>
            </div>
          </div>

          <div className="space-y-3 text-sm text-gray-300">
            <div className="flex items-center justify-between">
              <span>Dates</span>
              <span>{booking.pickupDate} → {booking.returnDate}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Pickup</span>
              <span>{booking.pickupLocation || booking.pickupLocationCoords?.lat?.toFixed(3)}{booking.pickupLocationCoords ? `, ${booking.pickupLocationCoords?.lng?.toFixed(3)}` : ''}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Dropoff</span>
              <span>{booking.pickupLocation || booking.dropoffLocationCoords?.lat?.toFixed(3)}{booking.dropoffLocationCoords ? `, ${booking.dropoffLocationCoords?.lng?.toFixed(3)}` : ''}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Days</span>
              <span>{days} days</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Add-ons</span>
              <span>{booking.addOns.length ? booking.addOns.join(', ') : 'None'}</span>
            </div>
          </div>

          <div className="border-t border-white/10 my-6" />

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-400">
              <span>Base total</span>
              <span>${carSnapshot.pricePerDay * days}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-400">
              <span>Add-ons</span>
              <span>${addOnsTotal}</span>
            </div>
            <div className="flex items-center justify-between text-lg font-black">
              <span>Total</span>
              <span className="text-yellow-400">${booking.totalPrice}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Checkout;
