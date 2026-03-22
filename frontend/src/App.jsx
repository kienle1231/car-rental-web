import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LuxuryLoader from './components/LuxuryLoader';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Cars from './pages/Cars';
import CarDetail from './pages/CarDetail';
import MyBookings from './pages/MyBookings';
import AdminDashboard from './pages/AdminDashboard';
import Checkout from './pages/Checkout';
import BookingConfirmation from './pages/BookingConfirmation';
import BookingDetail from './pages/BookingDetail';
import FloatingAIButton from './components/FloatingAIButton';

const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -12 }}
    transition={{ duration: 0.35, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
);

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Home /></PageTransition>} />
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
        <Route path="/cars" element={<PageTransition><Cars /></PageTransition>} />
        <Route path="/cars/:id" element={<PageTransition><CarDetail /></PageTransition>} />
        <Route path="/checkout" element={<PageTransition><Checkout /></PageTransition>} />
        <Route path="/booking-confirmation" element={<PageTransition><BookingConfirmation /></PageTransition>} />
        <Route path="/my-bookings" element={<PageTransition><MyBookings /></PageTransition>} />
        <Route path="/bookings/:id" element={<PageTransition><BookingDetail /></PageTransition>} />
        <Route path="/admin" element={<PageTransition><AdminDashboard /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <LuxuryLoader />;
  }

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-primary font-sans text-white">
          <Navbar />
          <main className="flex-grow">
            <AnimatedRoutes />
          </main>
          <Footer />
          <FloatingAIButton />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'rgba(15, 23, 42, 0.85)',
                color: '#f8fafc',
                border: '1px solid rgba(255, 255, 255, 0.16)',
                borderRadius: '14px',
                boxShadow: '0 12px 30px rgba(0,0,0,0.45)',
                backdropFilter: 'blur(12px)'
              },
              duration: 2600
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
