import { motion } from 'framer-motion';
import { Car } from 'lucide-react';

const LuxuryLoader = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-primary text-white relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-black via-slate-950 to-black" />
    <motion.div
      className="relative z-10 flex flex-col items-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 2.4, ease: 'linear' }}
        className="w-20 h-20 rounded-full border border-yellow-400/30 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.35)]"
      >
        <Car className="w-9 h-9 text-yellow-400" />
      </motion.div>
      <p className="mt-6 text-sm uppercase tracking-[0.4em] text-yellow-200">Loading your luxury experience...</p>
      <div className="mt-3 text-xs text-gray-500">Preparing your curated fleet</div>
    </motion.div>
    <motion.div
      className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent"
      animate={{ opacity: [0.6, 1, 0.6] }}
      transition={{ repeat: Infinity, duration: 2.6 }}
    />
  </div>
);

export default LuxuryLoader;
