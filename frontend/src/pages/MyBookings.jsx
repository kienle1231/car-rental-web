import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Car, MapPin, DollarSign, Receipt, Clock, ChevronRight, CheckCircle2, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getMyBookingsAPI } from '../services/api';

const statusColors = {
  Pending: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30',
  Approved: 'bg-green-400/10 text-green-400 border-green-400/30',
  Cancelled: 'bg-red-400/10 text-red-400 border-red-400/30',
  Completed: 'bg-blue-400/10 text-blue-400 border-blue-400/30',
};

const MyBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' or 'payments'

  useEffect(() => {
    (async () => {
      try {
        const { data } = await getMyBookingsAPI();
        setBookings(data);
      } catch (err) { console.error(err); }
      setLoading(false);
    })();
  }, []);

  const filteredBookings = activeTab === 'bookings' 
    ? bookings 
    : bookings.filter(b => b.paymentStatus === 'paid');

  return (
    <div className="pt-24 pb-16 min-h-screen bg-primary">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-5xl font-black">
            My <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent italic">Elite</span> Journey
          </motion.h1>

          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-sm">
            <button 
              onClick={() => setActiveTab('bookings')}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'bookings' ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/20' : 'text-gray-400 hover:text-white'}`}
            >
              <Car className="w-4 h-4" /> Bookings
            </button>
            <button 
              onClick={() => setActiveTab('payments')}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'payments' ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/20' : 'text-gray-400 hover:text-white'}`}
            >
              <Receipt className="w-4 h-4" /> Payment History
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 bg-white/5 rounded-3xl border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : filteredBookings.length === 0 ? (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="text-center py-32 bg-white/5 rounded-3xl border border-dashed border-white/10">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
              {activeTab === 'bookings' ? <Car className="w-10 h-10 text-gray-600" /> : <Receipt className="w-10 h-10 text-gray-600" />}
            </div>
            <p className="text-xl text-gray-400 font-medium">No records found here.</p>
            <button onClick={() => navigate('/cars')} className="mt-6 text-yellow-500 font-bold hover:underline transition">Browse our premium fleet &rarr;</button>
          </motion.div>
        ) : (
          <div className="grid gap-6">
            <AnimatePresence mode="popLayout">
              {filteredBookings.map((b, i) => (
                <motion.div 
                  layout
                  key={b._id} 
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="group relative bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col lg:flex-row gap-8 hover:border-yellow-500/40 hover:bg-white/[0.07] transition-all overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {/* Image Section */}
                  <div className="relative w-full lg:w-64 h-44 shrink-0 rounded-2xl overflow-hidden">
                    {b.car ? (
                      <img src={b.car.imageUrl} alt={b.car.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full bg-white/5 flex items-center justify-center"><Car className="w-12 h-12 text-gray-700" /></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-3 left-3 flex items-center gap-2">
                       <span className="text-[10px] bg-white/20 backdrop-blur-md text-white px-2 py-1 rounded-md uppercase font-bold tracking-wider">{b.car?.type || 'Luxury'}</span>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                          <h3 className="text-2xl font-black text-white group-hover:text-yellow-400 transition-colors uppercase tracking-tight">{b.car?.brand} {b.car?.model}</h3>
                          <div className="flex items-center gap-4 mt-2">
                             <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusColors[b.status] || 'bg-gray-500/10 text-gray-400 border-gray-500/30'}`}>
                                {b.status}
                             </span>
                             {b.paymentStatus === 'paid' && (
                               <span className="flex items-center gap-1 text-[10px] text-green-400 font-bold bg-green-400/10 px-2 py-1 rounded-md border border-green-400/20 uppercase tracking-widest">
                                  <CheckCircle2 className="w-3 h-3" /> Paid
                               </span>
                             )}
                          </div>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Total Fare</p>
                           <p className="text-2xl font-black text-white">{b.totalPrice.toLocaleString()} <span className="text-xs text-yellow-400">VNĐ</span></p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="space-y-1">
                           <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider flex items-center gap-1"><Clock className="w-3 h-3"/> Pickup</p>
                           <p className="text-sm font-semibold">{new Date(b.pickupDate).toLocaleDateString('vi-VN')}</p>
                        </div>
                        <div className="space-y-1">
                           <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider flex items-center gap-1"><History className="w-3 h-3"/> Return</p>
                           <p className="text-sm font-semibold">{new Date(b.returnDate).toLocaleDateString('vi-VN')}</p>
                        </div>
                        <div className="space-y-1 md:col-span-2">
                           <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider flex items-center gap-1"><MapPin className="w-3 h-3"/> Location</p>
                           <p className="text-sm font-semibold truncate">{b.pickupLocation}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 flex items-center justify-between">
                       <p className="text-[10px] text-gray-600 font-mono tracking-tighter uppercase">ID: #{b._id.slice(-8)}</p>
                       <button 
                        onClick={() => navigate(`/bookings/${b._id}`)}
                        className="flex items-center gap-2 bg-white/5 hover:bg-yellow-400 hover:text-black border border-white/10 hover:border-yellow-400 px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all"
                       >
                         View Details <ChevronRight className="w-4 h-4" />
                       </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;

