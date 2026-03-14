import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { loginAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Car, Mail, Lock, Eye, EyeOff, Sparkles } from 'lucide-react';
import GoogleAuthButton from '../components/GoogleAuthButton';
import toast from 'react-hot-toast';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isFocused, setIsFocused] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    try {
      const { data } = await loginAPI(form);
      login(data);
      toast.success(`Welcome back, ${data.name}!`);
      navigate(data.role === 'admin' ? '/admin' : '/cars');
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Invalid credentials');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 relative overflow-hidden">
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
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-slate-900/80 to-black/80" />
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.25),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(56,189,248,0.12),_transparent_60%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/80" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
        <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} className="space-y-6">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-xs text-yellow-200 uppercase tracking-[0.35em]">
            <Sparkles className="w-3 h-3" /> Luxury Access
          </div>
          <div>
            <h1 className="text-4xl md:text-6xl font-black leading-tight">Drive the Future</h1>
            <p className="text-gray-400 mt-4 max-w-xl">Access your luxury mobility account and unlock premium fleets tailored for elite journeys.</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}
          className="relative bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[32px] p-8 shadow-[0_40px_120px_rgba(0,0,0,0.55)]">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-400/20 blur-[80px] rounded-full" />
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/30">
                <Car className="w-8 h-8 text-black" />
              </div>
            </div>
            <h2 className="text-3xl font-black">Welcome Back</h2>
            <p className="text-gray-500 text-sm mt-2">Access your luxury mobility account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {errorMessage && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-200 text-sm rounded-xl px-4 py-3">
                {errorMessage}
              </div>
            )}
            <div className={`relative rounded-2xl border ${isFocused === 'email' ? 'border-yellow-400/60 shadow-[0_0_0_3px_rgba(245,158,11,0.15)]' : 'border-white/10'} bg-white/5 transition`}>
              <label className={`absolute left-12 top-1/2 -translate-y-1/2 text-xs uppercase tracking-[0.2em] text-gray-500 transition-all ${form.email ? 'top-3 text-[10px] text-yellow-200' : ''}`}>Email</label>
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                onFocus={() => setIsFocused('email')}
                onBlur={() => setIsFocused('')}
                className="w-full bg-transparent rounded-2xl pl-12 pr-4 py-5 text-white focus:outline-none"
                required
              />
            </div>
            <div className={`relative rounded-2xl border ${isFocused === 'password' ? 'border-yellow-400/60 shadow-[0_0_0_3px_rgba(245,158,11,0.15)]' : 'border-white/10'} bg-white/5 transition`}>
              <label className={`absolute left-12 top-1/2 -translate-y-1/2 text-xs uppercase tracking-[0.2em] text-gray-500 transition-all ${form.password ? 'top-3 text-[10px] text-yellow-200' : ''}`}>Password</label>
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                onFocus={() => setIsFocused('password')}
                onBlur={() => setIsFocused('')}
                className="w-full bg-transparent rounded-2xl pl-12 pr-12 py-5 text-white focus:outline-none"
                required
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 text-black py-4 rounded-2xl font-bold text-lg shadow-lg shadow-yellow-500/25 hover:shadow-yellow-500/40 transition disabled:opacity-50">
              {loading ? 'Logging in...' : 'Login'}
            </motion.button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-gray-500 uppercase tracking-[0.3em]">Or</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="grid grid-cols-1 gap-3">
            <GoogleAuthButton
              onSuccess={(data) => {
                login(data);
                toast.success(`Welcome back, ${data.name}!`);
                navigate(data.role === 'admin' ? '/admin' : '/cars');
              }}
              onError={(message) => setErrorMessage(message)}
            />
          </div>

          <p className="text-center text-gray-500 text-sm mt-6">
            Don't have an account? <Link to="/register" className="text-yellow-400 font-semibold hover:underline">Create one</Link>
          </p>

        </motion.div>
      </div>
    </div>
  );
};

export default Login;
