const LoadingSkeleton = ({ count = 8 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden animate-pulse">
        <div className="h-56 bg-white/10" />
        <div className="p-6 space-y-3">
          <div className="h-5 bg-white/10 rounded w-3/4" />
          <div className="h-3 bg-white/10 rounded w-full" />
          <div className="h-3 bg-white/10 rounded w-1/2" />
          <div className="flex justify-between mt-4">
            <div className="h-8 bg-white/10 rounded w-20" />
            <div className="h-8 bg-yellow-400/20 rounded-full w-24" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default LoadingSkeleton;
