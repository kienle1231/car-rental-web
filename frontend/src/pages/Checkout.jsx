import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, CreditCard, Lock, Calendar, MapPin, ShieldCheck, Check, Clock } from 'lucide-react';
import { createBookingAPI, confirmPaymentAPI } from '../services/api';
import toast from 'react-hot-toast';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [processing, setProcessing] = useState(false);
  const [qrStep, setQrStep] = useState(false);
  const [pendingBookingId, setPendingBookingId] = useState('');
  const [qrTimer, setQrTimer] = useState(30);
  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    note: ''
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

  useEffect(() => {
    let interval;
    if (qrStep && qrTimer > 0) {
      interval = setInterval(() => {
        setQrTimer((prev) => prev - 1);
      }, 1000);
    } else if (qrStep && qrTimer === 0) {
      handleConfirmPayment();
    }
    return () => clearInterval(interval);
  }, [qrStep, qrTimer]);

  const handleCreateBooking = async () => {
    if (!checkoutPayload) return;
    if (!customerForm.name || !customerForm.email || !customerForm.phone) {
      toast.error('Please fill in required guest information.');
      return;
    }

    const nameRegex = /^[a-zA-ZÀ-ỹ\s]{2,50}$/;
    if (!nameRegex.test(customerForm.name.trim())) {
      toast.error('Họ tên chỉ được chứa chữ cái (2-50 ký tự).');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerForm.email.trim())) {
      toast.error('Vui lòng nhập một địa chỉ email hợp lệ.');
      return;
    }

    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!phoneRegex.test(customerForm.phone.trim())) {
      toast.error('Vui lòng nhập số điện thoại Việt Nam hợp lệ (10 số).');
      return;
    }

    setProcessing(true);
    try {
      const payload = {
        ...checkoutPayload.booking,
        car: checkoutPayload.carId,
        paymentStatus: 'pending',
        paymentMethod: 'vietqr',
        customerName: customerForm.name,
        customerEmail: customerForm.email,
        customerPhone: customerForm.phone,
        note: customerForm.note,
      };
      const { data } = await createBookingAPI(payload);
      setPendingBookingId(data._id);
      setQrStep(true);
      setQrTimer(30);
    } catch (error) {
      toast.error('Could not initialize payment. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmPayment = async () => {
    try {
      setProcessing(true);
      const { data } = await confirmPaymentAPI({ bookingId: pendingBookingId });
      toast.success('Payment Secured! Your luxury journey is officially reserved.');
      sessionStorage.removeItem('checkoutPayload');
      
      navigate('/booking-confirmation', {
        state: {
          booking: data.booking,
          carSnapshot: checkoutPayload.carSnapshot,
          addOnsTotal: checkoutPayload.addOnsTotal,
          days: checkoutPayload.days
        }
      });
    } catch (error) {
      toast.error('Confirmation failed. Please try again or contact support.');
    } finally {
      setProcessing(false);
    }
  };

  if (!checkoutPayload) return null;

  const { booking, carSnapshot, addOnsTotal, days } = checkoutPayload;
  const qrUrl = `https://img.vietqr.io/image/MB-0981313248-compact.png?amount=${booking.totalPrice}&addInfo=BOOKING_${pendingBookingId}&accountName=LE%20TRUNG%20KIEN`;

  return (
    <div className="pt-24 pb-16 min-h-screen relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.15),_transparent_70%)]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10">
        
        <AnimatePresence mode="wait">
          {!qrStep ? (
            <motion.div 
              key="checkout-form"
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -20 }}
              className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl flex flex-col justify-center"
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-lg shadow-yellow-500/20">
                  <ShieldCheck className="w-6 h-6 text-black" />
                </div>
                <div>
                  <p className="text-sm text-yellow-500 font-semibold uppercase tracking-wider">Secure Checkout</p>
                  <h1 className="text-3xl font-black text-white">Complete Booking</h1>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-4 relative z-10 bg-black/20 p-5 rounded-2xl border border-white/5">
                  <h3 className="text-lg font-bold text-white mb-2">Guest Information</h3>
                  <input
                    type="text"
                    placeholder="Full Name *"
                    value={customerForm.name}
                    onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-yellow-500/50"
                  />
                  <input
                    type="email"
                    placeholder="Email Address *"
                    value={customerForm.email}
                    onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-yellow-500/50"
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number *"
                    value={customerForm.phone}
                    onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-yellow-500/50"
                  />
                  <textarea
                    placeholder="Items/Notes e.g. 'Mang theo 2 vali lớn' (Optional)"
                    value={customerForm.note}
                    onChange={(e) => setCustomerForm({ ...customerForm, note: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-yellow-500/50 h-24 resize-none"
                  />
                </div>

                <div className="p-5 rounded-2xl bg-white/5 border border-yellow-500/50 relative overflow-hidden group shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                  <div className="absolute top-0 right-0 p-4">
                    <div className="w-6 h-6 rounded-full bg-yellow-400 inset-0 flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-black" />
                    </div>
                  </div>
                  <QrCode className="w-6 h-6 text-yellow-400 mb-2" />
                  <h3 className="text-lg font-bold text-white mb-1">VietQR Bank Transfer</h3>
                  <p className="text-xs text-gray-400">Zero fees. Instant confirmation via MB Bank system.</p>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500 justify-center pb-2">
                  <Lock className="w-3 h-3 text-green-400" />
                  <p>AES-256 Bit Encryption Secured Transaction</p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreateBooking}
                  disabled={processing}
                  className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 text-black py-4 rounded-2xl font-bold text-lg shadow-lg shadow-yellow-500/25 hover:shadow-yellow-500/40 transition disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <span className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  ) : (
                    <>
                      <QrCode className="w-5 h-5" /> Proceed to QR Payment
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="qr-step"
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="bg-white/5 border border-yellow-500/30 rounded-3xl p-8 backdrop-blur-xl shadow-[0_0_50px_rgba(245,158,11,0.15)] flex flex-col items-center relative overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-white/10 overflow-hidden">
                <motion.div 
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 20, ease: "linear" }}
                  className="h-full bg-yellow-400 shadow-[0_0_10px_rgba(245,158,11,1)]"
                />
              </div>

              <div className="text-center mb-6">
                <span className="text-yellow-400 text-sm font-semibold uppercase tracking-widest mb-2 block">Transfer Amount</span>
                <div className="text-5xl font-black text-white">{booking.totalPrice.toLocaleString()} VNĐ</div>
                <p className="text-gray-400 text-sm mt-3">Scan with your banking app</p>
              </div>

              <div className="p-4 bg-white rounded-3xl shadow-xl mb-6 relative group border-[4px] border-yellow-400">
                <div className="absolute inset-0 bg-yellow-400/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <img src={qrUrl} alt="VietQR" className="w-[220px] h-[220px] object-contain relative z-10" />
              </div>

              <div className="w-full max-w-sm bg-black/40 border border-white/5 rounded-2xl p-6 space-y-4 mb-6 relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-20 h-20 bg-yellow-400/10 rounded-full blur-2xl" />
                <div className="flex justify-between items-center text-sm relative z-10">
                  <span className="text-gray-400">Bank</span>
                  <span className="text-white font-medium">MB Bank</span>
                </div>
                <div className="flex justify-between items-center text-sm relative z-10">
                  <span className="text-gray-400">Account No</span>
                  <span className="text-white font-medium text-lg tracking-wider">0981313248</span>
                </div>
                <div className="flex justify-between items-center text-sm relative z-10">
                  <span className="text-gray-400">Account Name</span>
                  <span className="text-yellow-400 font-bold uppercase tracking-wider">LE TRUNG KIEN</span>
                </div>
                <div className="pt-4 mt-2 border-t border-white/10 flex flex-col gap-1 relative z-10">
                  <span className="text-gray-400 text-xs text-center uppercase tracking-wider">Transfer Content (Important)</span>
                  <span className="text-white font-mono font-bold text-center bg-white/5 py-3 rounded-xl mt-1 text-lg border border-white/10">BOOKING_{pendingBookingId}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-yellow-400 mb-4 font-semibold animate-pulse">
                <span className="w-5 h-5 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" />
                Waiting for payment confirmation...
              </div>

              <div className="flex items-center gap-2 text-gray-500 text-sm mb-6">
                <Clock className="w-4 h-4" />
                Auto confirm in {qrTimer}s
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleConfirmPayment}
                disabled={processing}
                className="w-full max-w-sm bg-white/5 border border-white/10 text-white py-4 rounded-2xl font-bold hover:bg-white/10 transition flex items-center justify-center gap-2"
              >
                {processing ? (
                  <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-5 h-5 text-green-400" /> I have transferred
                  </>
                )}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl h-fit">
          <div className="flex items-start gap-5 mb-8">
            <img src={carSnapshot.imageUrl} alt={carSnapshot.name} className="w-28 h-20 rounded-2xl object-cover shadow-lg" />
            <div>
              <p className="text-xs text-yellow-500 font-semibold uppercase tracking-wider mb-1">{carSnapshot.brand}</p>
              <h3 className="text-xl font-bold text-white mb-2">{carSnapshot.model}</h3>
              <div className="inline-flex items-center bg-white/10 px-3 py-1 rounded-full text-xs text-gray-300">
                ${carSnapshot.pricePerDay}/day
              </div>
            </div>
          </div>

          <div className="space-y-4 text-sm text-gray-300 bg-black/20 p-5 rounded-2xl border border-white/5 mb-8">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <span className="flex items-center gap-2 text-gray-400"><Calendar className="w-4 h-4" /> Dates</span>
              <span className="font-medium text-white">{booking.pickupDate} → {booking.returnDate}</span>
            </div>
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <span className="flex items-center gap-2 text-gray-400"><MapPin className="w-4 h-4" /> Location</span>
              <span className="font-medium text-white text-right max-w-[200px] truncate">{booking.pickupLocation || 'Premium Hub'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Duration</span>
              <span className="font-medium text-white">{days} days</span>
            </div>
          </div>

          <div className="space-y-3 p-5 rounded-2xl bg-white/5 border border-white/5">
            <div className="flex items-center justify-between text-sm text-gray-400">
              <span>Rental ({days} days)</span>
              <span className="text-white">${carSnapshot.pricePerDay * days}</span>
            </div>
            {addOnsTotal > 0 && (
              <div className="flex items-center justify-between text-sm text-gray-400">
                <span>Premium Add-ons</span>
                <span className="text-white">+${addOnsTotal}</span>
              </div>
            )}
            <div className="border-t border-white/10 my-2" />
            <div className="flex items-center justify-between text-xl font-black">
              <span className="text-white">Total</span>
              <span className="text-yellow-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">{booking.totalPrice.toLocaleString()} VNĐ</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Checkout;
