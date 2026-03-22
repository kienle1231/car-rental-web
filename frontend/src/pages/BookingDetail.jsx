import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Calendar, MapPin, CreditCard, ChevronLeft, Download, Hash, Phone, Mail, User, Clock, ShieldCheck } from 'lucide-react';
import { getBookingByIdAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const BookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const backPath = user?.role === 'admin' ? '/admin' : '/my-bookings';

  useEffect(() => {
    (async () => {
      try {
        console.log('Fetching booking:', id);
        const { data } = await getBookingByIdAPI(id);
        console.log('Booking data received:', data);
        setBooking(data);
      } catch (err) {
        console.error('API Error:', err.response?.data || err.message);
        setError(err.response?.data?.message || err.response?.data?.error || 'Could not load booking details.');
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="pt-32 flex justify-center">
        <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="pt-32 text-center text-white px-6">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
           <Hash className="w-10 h-10 text-red-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2">{error || 'Booking Not Found'}</h2>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">The requested booking ID could not be loaded. It may not exist or you might not have the necessary permissions.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button onClick={() => navigate(backPath)} className="bg-yellow-400 text-black px-8 py-3 rounded-full font-black uppercase text-xs tracking-widest hover:shadow-lg hover:shadow-yellow-400/20 transition">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const days = Math.max(1, Math.ceil((new Date(booking.returnDate) - new Date(booking.pickupDate)) / (1000 * 60 * 60 * 24)));

  return (
    <div className="pt-24 pb-16 min-h-screen bg-primary">
      <div className="max-w-4xl mx-auto px-6">
        <button onClick={() => navigate(backPath)} className="flex items-center gap-2 text-gray-400 hover:text-white transition mb-6">
          <ChevronLeft className="w-5 h-5" /> Back to List
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
          className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl overflow-hidden relative">
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-yellow-400/10 flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-yellow-400" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                   <p className="text-xs text-yellow-500 font-bold uppercase tracking-[0.2em]">Rental Ticket</p>
                   <div className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      booking.status === 'Approved' ? 'border-green-500/50 text-green-400 bg-green-500/10' : 
                      booking.status === 'Pending' ? 'border-yellow-500/50 text-yellow-400 bg-yellow-500/10' :
                      'border-red-500/50 text-red-400 bg-red-500/10'
                   }`}>
                      {booking.status}
                   </div>
                </div>
                <h1 className="text-3xl font-black">Booking Confirmation</h1>
              </div>
            </div>
            
            <button onClick={() => window.print()} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition shadow-lg">
              <Download className="w-4 h-4 text-yellow-400" /> Print Ticket
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-10">
            {/* Left Column */}
            <div className="space-y-8">
              {/* Car Info */}
              <div className="flex items-center gap-6 p-4 rounded-2xl bg-white/5 border border-white/5">
                <img src={booking.car?.imageUrl} alt={booking.car?.name} className="w-32 h-24 object-cover rounded-xl" />
                <div>
                  <h3 className="text-xl font-bold">{booking.car?.brand} {booking.car?.model}</h3>
                  <p className="text-sm text-gray-400">{booking.car?.name}</p>
                  <div className="flex items-center gap-3 mt-2">
                     <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded uppercase font-bold">{booking.car?.type}</span>
                     <span className="text-xs text-gray-500">Year: {booking.car?.year}</span>
                  </div>
                </div>
              </div>

              {/* Guest Details */}
              <div className="space-y-4">
                 <h4 className="text-sm font-bold uppercase tracking-widest text-gray-500 border-b border-white/5 pb-2">Guest Information</h4>
                 <div className="grid grid-cols-2 gap-y-4 text-sm">
                    <div className="flex items-start gap-3">
                       <User className="w-4 h-4 text-accent mt-0.5" />
                       <div><p className="text-gray-500 text-[10px] uppercase font-bold">Full Name</p><p>{booking.customerName}</p></div>
                    </div>
                    <div className="flex items-start gap-3">
                       <Phone className="w-4 h-4 text-accent mt-0.5" />
                       <div><p className="text-gray-500 text-[10px] uppercase font-bold">Phone</p><p>{booking.customerPhone}</p></div>
                    </div>
                    <div className="flex items-start gap-3 col-span-2">
                       <Mail className="w-4 h-4 text-accent mt-0.5" />
                       <div><p className="text-gray-500 text-[10px] uppercase font-bold">Email</p><p>{booking.customerEmail}</p></div>
                    </div>
                 </div>
              </div>

              {/* Trip Details */}
              <div className="space-y-4">
                 <h4 className="text-sm font-bold uppercase tracking-widest text-gray-500 border-b border-white/5 pb-2">Trip Timeline</h4>
                 <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 p-4 rounded-2xl bg-white/5 flex items-start gap-3">
                        <Clock className="w-5 h-5 text-accent" />
                        <div>
                           <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Pickup Date</p>
                           <p className="font-bold text-lg">{new Date(booking.pickupDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                           <p className="text-xs text-gray-400">@ Location: {booking.pickupLocation}</p>
                        </div>
                    </div>
                    <div className="flex-1 p-4 rounded-2xl bg-white/5 flex items-start gap-3">
                        <Clock className="w-5 h-5 text-red-400" />
                        <div>
                           <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Return Date</p>
                           <p className="font-bold text-lg">{new Date(booking.returnDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                           <p className="text-xs text-gray-400">Total Duration: {days} Days</p>
                        </div>
                    </div>
                 </div>
              </div>
            </div>

            {/* Right Column - Billing */}
            <div className="bg-white/5 border border-white/5 rounded-3xl p-6 h-fit space-y-6">
               <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Billing & Payment</h4>
               
               <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                     <span className="text-gray-400">Base Fare ({days} days)</span>
                     <span className="font-mono">{(booking.totalPrice - (booking.lateFee || 0)).toLocaleString()} VNĐ</span>
                  </div>
                  {booking.lateFee > 0 && (
                    <div className="flex justify-between text-sm text-red-400 font-bold">
                       <span>Late Return Fee</span>
                       <span className="font-mono">{booking.lateFee.toLocaleString()} VNĐ</span>
                    </div>
                  )}
                  <div className="h-px bg-white/10 my-4"></div>
                  <div className="flex justify-between items-end">
                     <span className="text-lg font-bold">Total Amount</span>
                     <div className="text-right">
                        <p className="text-3xl font-black text-yellow-400">{booking.totalPrice.toLocaleString()} VNĐ</p>
                        <p className="text-[10px] text-green-400 uppercase font-bold tracking-widest flex items-center justify-end gap-1">
                           <ShieldCheck className="w-3 h-3" /> {booking.paymentStatus === 'paid' ? 'PAID FULL' : 'PENDING'}
                        </p>
                     </div>
                  </div>
               </div>

               <div className="pt-6 space-y-4">
                  <div className="bg-primary/50 p-4 rounded-xl border border-white/5">
                     <p className="text-[9px] text-gray-600 uppercase font-bold mb-2 tracking-widest">Transaction Metadata</p>
                     <div className="space-y-1.5 font-mono text-xs">
                        <p className="flex justify-between"><span className="text-gray-500">ID:</span> <span className="text-white/70 truncate ml-2">#{booking._id}</span></p>
                        <p className="flex justify-between"><span className="text-gray-500">TXN:</span> <span className="text-white/70 truncate ml-2">{booking.transactionId || '---'}</span></p>
                        <p className="flex justify-between"><span className="text-gray-500">Method:</span> <span className="text-white/70">{booking.paymentMethod?.toUpperCase()}</span></p>
                     </div>
                  </div>
               </div>

               <div className="text-[10px] text-gray-500 text-center uppercase tracking-widest pt-4">
                  Powered by LuxeRide Elite Systems
               </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BookingDetail;
