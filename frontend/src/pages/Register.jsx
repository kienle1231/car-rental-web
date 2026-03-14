import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { registerAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Car, Mail, Lock, User, Eye, EyeOff, CheckCircle2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [focusField, setFocusField] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await registerAPI({
        name: form.name,
        email: form.email,
        password: form.password
      });
      login(data);
      toast.success('Account created successfully!');
      navigate('/cars');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Register failed');
    }
    setLoading(false);
  };

  const passwordStrength = (() => {
    const score = [form.password.length >= 8, /[A-Z]/.test(form.password), /[0-9]/.test(form.password), /[^A-Za-z0-9]/.test(form.password)].filter(Boolean).length;
    if (!form.password) return { label: 'Enter password', color: 'bg-white/10', value: 0 };
    if (score <= 1) return { label: 'Weak', color: 'bg-red-500/70', value: 25 };
    if (score === 2) return { label: 'Fair', color: 'bg-yellow-400/70', value: 50 };
    if (score === 3) return { label: 'Strong', color: 'bg-amber-400/80', value: 75 };
    return { label: 'Elite', color: 'bg-emerald-400/80', value: 100 };
  })();

  const isNameValid = form.name.length > 2;
  const isEmailValid = /.+@.+\..+/.test(form.email);
  const isPasswordValid = form.password.length >= 8;
  const isConfirmValid = form.confirmPassword && form.password === form.confirmPassword;

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
            <Sparkles className="w-3 h-3" /> Join the Club
          </div>
          <div>
            <h1 className="text-4xl md:text-6xl font-black leading-tight">Design Your Journey</h1>
            <p className="text-gray-400 mt-4 max-w-xl">Create a luxury account to unlock elite fleets, concierge service, and private offers.</p>
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
            <h2 className="text-3xl font-black">Create Account</h2>
            <p className="text-gray-500 text-sm mt-2">Access the elite LUXERIDE network</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className={`relative rounded-2xl border ${focusField === 'name' ? 'border-yellow-400/60 shadow-[0_0_0_3px_rgba(245,158,11,0.15)]' : 'border-white/10'} bg-white/5 transition`}>
              <label className={`absolute left-12 top-1/2 -translate-y-1/2 text-xs uppercase tracking-[0.2em] text-gray-500 transition-all ${form.name ? 'top-3 text-[10px] text-yellow-200' : ''}`}>Full Name</label>
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                onFocus={() => setFocusField('name')}
                onBlur={() => setFocusField('')}
                className="w-full bg-transparent rounded-2xl pl-12 pr-4 py-5 text-white focus:outline-none"
                required
              />
              {isNameValid && <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400" />}
            </div>

            <div className={`relative rounded-2xl border ${focusField === 'email' ? 'border-yellow-400/60 shadow-[0_0_0_3px_rgba(245,158,11,0.15)]' : 'border-white/10'} bg-white/5 transition`}>
              <label className={`absolute left-12 top-1/2 -translate-y-1/2 text-xs uppercase tracking-[0.2em] text-gray-500 transition-all ${form.email ? 'top-3 text-[10px] text-yellow-200' : ''}`}>Email</label>
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                onFocus={() => setFocusField('email')}
                onBlur={() => setFocusField('')}
                className="w-full bg-transparent rounded-2xl pl-12 pr-4 py-5 text-white focus:outline-none"
                required
              />
              {isEmailValid && <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400" />}
            </div>

            <div className={`relative rounded-2xl border ${focusField === 'password' ? 'border-yellow-400/60 shadow-[0_0_0_3px_rgba(245,158,11,0.15)]' : 'border-white/10'} bg-white/5 transition`}>
              <label className={`absolute left-12 top-1/2 -translate-y-1/2 text-xs uppercase tracking-[0.2em] text-gray-500 transition-all ${form.password ? 'top-3 text-[10px] text-yellow-200' : ''}`}>Password</label>
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                onFocus={() => setFocusField('password')}
                onBlur={() => setFocusField('')}
                className="w-full bg-transparent rounded-2xl pl-12 pr-12 py-5 text-white focus:outline-none"
                required
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Password strength</span>
                <span className="text-yellow-200">{passwordStrength.label}</span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div className={`h-full ${passwordStrength.color}`} style={{ width: `${passwordStrength.value}%` }} />
              </div>
            </div>

            <div className={`relative rounded-2xl border ${focusField === 'confirmPassword' ? 'border-yellow-400/60 shadow-[0_0_0_3px_rgba(245,158,11,0.15)]' : 'border-white/10'} bg-white/5 transition`}>
              <label className={`absolute left-12 top-1/2 -translate-y-1/2 text-xs uppercase tracking-[0.2em] text-gray-500 transition-all ${form.confirmPassword ? 'top-3 text-[10px] text-yellow-200' : ''}`}>Confirm Password</label>
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type={showConfirmPw ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                onFocus={() => setFocusField('confirmPassword')}
                onBlur={() => setFocusField('')}
                className="w-full bg-transparent rounded-2xl pl-12 pr-12 py-5 text-white focus:outline-none"
                required
              />
              <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                {showConfirmPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
              {isConfirmValid && <CheckCircle2 className="absolute right-12 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400" />}
            </div>

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading || !isPasswordValid || !isConfirmValid}
              className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 text-black py-4 rounded-2xl font-bold text-lg shadow-lg shadow-yellow-500/25 hover:shadow-yellow-500/40 transition disabled:opacity-50">
              {loading ? 'Creating...' : 'Create Account'}
            </motion.button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            Already have an account? <Link to="/login" className="text-yellow-400 font-semibold hover:underline">Sign In</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
