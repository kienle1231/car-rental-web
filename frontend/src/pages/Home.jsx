import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, Clock, Star, Car, MapPin, Calendar, Search } from 'lucide-react';
import { getCarsAPI, getMyBookingsAPI } from '../services/api';
import CarCard from '../components/CarCard';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const parallaxX = useSpring(useMotionValue(0), { stiffness: 120, damping: 20 });
  const parallaxY = useSpring(useMotionValue(0), { stiffness: 120, damping: 20 });
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useState({ location: '', startDate: '', endDate: '', type: '' });

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchParams.location) params.append('location', searchParams.location);
    if (searchParams.type) params.append('type', searchParams.type);
    navigate(`/cars?${params.toString()}`);
  };

  const handleParallax = (event) => {
    const { innerWidth, innerHeight } = window;
    const x = (event.clientX / innerWidth - 0.5) * 24;
    const y = (event.clientY / innerHeight - 0.5) * 24;
    parallaxX.set(x);
    parallaxY.set(y);
  };

  const [recommended, setRecommended] = useState([]);
  const [recommendedLoading, setRecommendedLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadRecommendations = async () => {
      try {
        const [carsRes, bookingsRes] = await Promise.all([
          getCarsAPI(),
          getMyBookingsAPI().catch(() => ({ data: [] }))
        ]);
        if (!isMounted) return;
        const cars = Array.isArray(carsRes.data) ? carsRes.data : (carsRes.data?.data || []);
        const bookings = Array.isArray(bookingsRes.data) ? bookingsRes.data : (bookingsRes.data?.data || []);

        const preferredLocations = new Map();
        const preferredBrands = new Map();
        const bookedCarIds = new Set();
        const pricePoints = [];

        bookings.forEach((booking) => {
          if (booking?.car?._id) bookedCarIds.add(booking.car._id);
          if (booking?.pickupLocation) {
            preferredLocations.set(booking.pickupLocation, (preferredLocations.get(booking.pickupLocation) || 0) + 1);
          }
          if (booking?.car?.brand) {
            preferredBrands.set(booking.car.brand, (preferredBrands.get(booking.car.brand) || 0) + 1);
          }
          if (booking?.car?.pricePerDay) {
            pricePoints.push(booking.car.pricePerDay);
          }
        });

        const pricePreference = pricePoints.length
          ? pricePoints.reduce((acc, price) => acc + price, 0) / pricePoints.length
          : null;

        const carsWithScore = cars.map((car) => {
          let score = 0;
          if (bookedCarIds.has(car._id)) score += 3;
          if (preferredBrands.has(car.brand)) score += 2 + preferredBrands.get(car.brand);
          if (preferredLocations.has(car.location)) score += 1 + preferredLocations.get(car.location);
          if (pricePreference) {
            const diff = Math.abs(car.pricePerDay - pricePreference);
            score += Math.max(0, 3 - diff / 50);
          }
          score += (car.rating || 4) * 0.8;
          score += car.availability ? 1 : 0;
          return { ...car, score };
        });

        const ranked = carsWithScore.sort((a, b) => b.score - a.score).slice(0, 6);
        setRecommended(ranked);
      } catch (error) {
        console.error(error);
      } finally {
        if (isMounted) setRecommendedLoading(false);
      }
    };

    loadRecommendations();
    return () => { isMounted = false; };
  }, []);

  const features = [
    { icon: <Shield className="w-8 h-8" />, title: 'Fully Insured', desc: 'Every car comes with comprehensive insurance coverage for peace of mind.' },
    { icon: <Clock className="w-8 h-8" />, title: '24/7 Support', desc: 'Round-the-clock customer service to assist you anytime, anywhere.' },
    { icon: <Star className="w-8 h-8" />, title: 'Premium Fleet', desc: 'Curated collection of the world\'s finest luxury and sports cars.' },
    { icon: <Car className="w-8 h-8" />, title: 'Easy Booking', desc: 'Reserve your dream car in just a few clicks with instant confirmation.' },
  ];

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section onMouseMove={handleParallax} className="relative min-h-screen flex items-center justify-center">
        <div className="absolute inset-0">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
            poster="https://assets.mixkit.co/videos/52427/52427-thumb-720-0.jpg"
          >
            <source src="https://assets.mixkit.co/videos/52427/52427-1080.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/50" />
        </div>

        <motion.div style={{ x: parallaxX, y: parallaxY }} className="relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -60 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.9 }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 mb-6 backdrop-blur">
              <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
              <span className="text-yellow-200 text-sm font-medium">Luxury mobility platform</span>
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6">
              Drive the{' '}
              <span className="bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500 bg-clip-text text-transparent">
                Future
              </span>{' '}
              of Mobility
            </h1>

            <p className="text-lg text-gray-300 mb-10 max-w-lg leading-relaxed">
              Rent iconic cars worldwide in minutes. Curated fleets, elite service, and a seamless premium experience.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/cars">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-gradient-to-r from-yellow-400 to-amber-500 text-black px-8 py-4 rounded-full font-bold text-lg flex items-center gap-2 shadow-xl shadow-yellow-500/25 hover:shadow-yellow-500/40 transition-shadow">
                  Browse Cars <ArrowRight className="w-5 h-5" />
                </motion.button>
              </Link>
              <Link to={user ? (user.role === 'admin' ? '/admin' : '/my-bookings') : '/register'}>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="border border-white/30 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/10 transition">
                  {user ? (user.role === 'admin' ? 'Dashboard' : 'My Bookings') : 'Create Account'}
                </motion.button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative"
          >
            <div className="absolute inset-0 rounded-[32px] bg-gradient-to-r from-yellow-400/30 via-transparent to-white/10 blur-3xl" />
            <motion.form
              onSubmit={handleSearch}
              className="relative bg-white/10 border border-white/20 rounded-[32px] p-6 backdrop-blur-2xl shadow-2xl shadow-black/40"
            >
              <div className="flex items-center gap-2 text-white mb-6">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                  <Search className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Instant Search</p>
                  <p className="text-lg font-semibold">Find your next ride</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white/10 border border-white/20 rounded-2xl px-4 py-3 flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-yellow-400" />
                  <input
                    type="text"
                    placeholder="Pick-up location"
                    value={searchParams.location}
                    onChange={(e) => setSearchParams({ ...searchParams, location: e.target.value })}
                    className="bg-transparent w-full text-sm text-white placeholder:text-gray-400 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/10 border border-white/20 rounded-2xl px-4 py-3 flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-yellow-400" />
                    <input
                      type="text"
                      placeholder="Start date"
                      value={searchParams.startDate}
                      onChange={(e) => setSearchParams({ ...searchParams, startDate: e.target.value })}
                      className="bg-transparent w-full text-sm text-white placeholder:text-gray-400 focus:outline-none"
                    />
                  </div>
                  <div className="bg-white/10 border border-white/20 rounded-2xl px-4 py-3 flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-yellow-400" />
                    <input
                      type="text"
                      placeholder="End date"
                      value={searchParams.endDate}
                      onChange={(e) => setSearchParams({ ...searchParams, endDate: e.target.value })}
                      className="bg-transparent w-full text-sm text-white placeholder:text-gray-400 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="bg-white/10 border border-white/20 rounded-2xl px-4 py-3 flex items-center gap-3">
                  <Car className="w-5 h-5 text-yellow-400" />
                  <select 
                    value={searchParams.type}
                    onChange={(e) => setSearchParams({ ...searchParams, type: e.target.value })}
                    className="bg-transparent w-full text-sm text-white focus:outline-none"
                  >
                    <option className="text-black" value="">Car type</option>
                    <option className="text-black" value="SUV">SUV</option>
                    <option className="text-black" value="Sedan">Sedan</option>
                    <option className="text-black" value="Coupe">Coupe</option>
                    <option className="text-black" value="Sports">Sports</option>
                    <option className="text-black" value="Supercar">Supercar</option>
                  </select>
                </div>
                <motion.button type="submit" whileHover={{ scale: 1.02 }} className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 text-black py-3 rounded-2xl font-bold shadow-lg shadow-yellow-500/30">
                  Search Cars
                </motion.button>
              </div>
            </motion.form>
          </motion.div>
        </motion.div>

        {/* Floating search bar */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="absolute -bottom-10 inset-x-0 px-4 md:px-6 flex justify-center"
        >
          <div className="bg-white/10 border border-white/20 rounded-full shadow-2xl shadow-black/50 backdrop-blur-2xl px-4 py-4 md:px-6 w-full max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr_1fr_auto] gap-3 items-center">
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-4 py-3">
                <MapPin className="w-4 h-4 text-yellow-400" />
                <input value={searchParams.location} onChange={(e) => setSearchParams({ ...searchParams, location: e.target.value })} className="bg-transparent text-sm text-white placeholder:text-gray-400 w-full focus:outline-none" placeholder="Where to pick up?" />
              </div>
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-4 py-3">
                <Calendar className="w-4 h-4 text-yellow-400" />
                <input value={searchParams.startDate} onChange={(e) => setSearchParams({ ...searchParams, startDate: e.target.value })} className="bg-transparent text-sm text-white placeholder:text-gray-400 w-full focus:outline-none" placeholder="Start date" />
              </div>
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-4 py-3">
                <Calendar className="w-4 h-4 text-yellow-400" />
                <input value={searchParams.endDate} onChange={(e) => setSearchParams({ ...searchParams, endDate: e.target.value })} className="bg-transparent text-sm text-white placeholder:text-gray-400 w-full focus:outline-none" placeholder="End date" />
              </div>
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-4 py-3">
                <Car className="w-4 h-4 text-yellow-400" />
                <select value={searchParams.type} onChange={(e) => setSearchParams({ ...searchParams, type: e.target.value })} className="bg-transparent text-sm text-white focus:outline-none w-full appearance-none">
                  <option className="text-black" value="">Car type</option>
                  <option className="text-black" value="SUV">SUV</option>
                  <option className="text-black" value="Sedan">Sedan</option>
                  <option className="text-black" value="Coupe">Coupe</option>
                  <option className="text-black" value="Sports">Sports</option>
                  <option className="text-black" value="Supercar">Supercar</option>
                </select>
              </div>
              <motion.button onClick={handleSearch} whileHover={{ scale: 1.03 }} className="bg-gradient-to-r from-yellow-400 to-amber-500 text-black px-6 py-3 rounded-full font-bold shadow-lg shadow-yellow-500/30">
                Search
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute bottom-16 left-1/2 -translate-x-1/2 text-gray-500 flex flex-col items-center gap-2">
          <span className="text-xs uppercase tracking-widest">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-yellow-400 to-transparent" />
        </motion.div>
      </section>

      {!user && (
        <section className="bg-secondary/60 border-y border-white/10 py-10">
          <div className="max-w-7xl mx-auto px-6">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-xl shadow-2xl shadow-black/30">
              <div>
                <p className="text-sm text-yellow-400 font-semibold uppercase tracking-widest">Member Access</p>
                <h3 className="text-2xl md:text-3xl font-black mt-2">Đăng nhập để quản lý đặt xe của bạn</h3>
                <p className="text-gray-500 mt-2">Xem lịch sử đặt xe, thanh toán và ưu đãi dành riêng cho thành viên.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/login">
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="bg-gradient-to-r from-yellow-400 to-amber-500 text-black px-6 py-3 rounded-full font-bold shadow-lg shadow-yellow-500/25">
                    Đăng nhập
                  </motion.button>
                </Link>
                <Link to="/register">
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="border border-white/30 text-white px-6 py-3 rounded-full font-semibold hover:bg-white/10 transition">
                    Tạo tài khoản
                  </motion.button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Stats Bar */}
      <section className="bg-secondary border-y border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { num: '500+', label: 'Happy Clients' },
            { num: '50+', label: 'Premium Cars' },
            { num: '4.9', label: 'Average Rating' },
            { num: '24/7', label: 'Support' },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}>
              <div className="text-3xl font-black bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">{s.num}</div>
              <div className="text-sm text-gray-500 mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Recommended */}
      <section className="py-24 bg-primary">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
            <div>
              <p className="text-sm text-yellow-400 font-semibold uppercase tracking-widest">Recommended</p>
              <h2 className="text-3xl md:text-5xl font-black mt-2">Recommended for You</h2>
              <p className="text-gray-500 mt-3 max-w-2xl">Curated by your booking history, preferred locations, and luxury ratings.</p>
            </div>
            <Link to="/cars" className="text-sm text-yellow-400 font-semibold hover:text-yellow-300">Explore full fleet</Link>
          </div>

          {recommendedLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[330px] bg-white/5 border border-white/10 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {recommended.map((car) => (
                <CarCard key={car._id} car={car} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-primary">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">Why Choose <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">LUXERIDE</span></h2>
            <p className="text-gray-500 max-w-2xl mx-auto">We're dedicated to providing an exceptional rental experience with premium vehicles and world-class service.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }} viewport={{ once: true }} whileHover={{ y: -8 }}
                className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl p-8 text-center hover:border-yellow-500/40 transition-all group">
                <div className="text-yellow-400 mb-4 flex justify-center group-hover:scale-110 transition-transform">{f.icon}</div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1920&q=80" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/80" />
        </div>
        <div className="relative z-10 text-center max-w-3xl mx-auto px-6">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-4xl md:text-5xl font-black mb-6">
            Ready to Hit the <span className="text-yellow-400">Road</span>?
          </motion.h2>
          <p className="text-gray-400 mb-8 text-lg">Join thousands of satisfied customers who trust LUXERIDE for their premium driving experience.</p>
          <Link to="/cars">
            <motion.button whileHover={{ scale: 1.05 }} className="bg-gradient-to-r from-yellow-400 to-amber-500 text-black px-10 py-4 rounded-full font-bold text-lg shadow-xl shadow-yellow-500/25">
              Explore Our Fleet
            </motion.button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
