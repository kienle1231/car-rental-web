const SHOWROOM_VIDEO = 'https://assets.mixkit.co/videos/52427/52427-1080.mp4';

const AuthShowroom = () => (
  <div className="relative w-full h-[320px] md:h-[520px] lg:h-[640px] rounded-[32px] overflow-hidden border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-950/80 to-black shadow-[0_40px_120px_rgba(0,0,0,0.6)]">
    <video
      autoPlay
      muted
      loop
      playsInline
      className="absolute inset-0 w-full h-full object-cover"
      poster="https://assets.mixkit.co/videos/52427/52427-thumb-720-0.jpg"
    >
      <source src={SHOWROOM_VIDEO} type="video/mp4" />
    </video>
    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/60" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.35),_transparent_60%)]" />
    <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-xs text-gray-300">
      <span className="uppercase tracking-[0.3em]">Luxury Showreel</span>
      <span className="text-yellow-200">Cinematic driving loop</span>
    </div>
  </div>
);

export default AuthShowroom;
