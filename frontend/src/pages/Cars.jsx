import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal } from 'lucide-react';
import { getCarsAPI } from '../services/api';
import CarCard from '../components/CarCard';
import LoadingSkeleton from '../components/LoadingSkeleton';

const Cars = () => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [brand, setBrand] = useState('');
  const [type, setType] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const brands = ['Tesla', 'BMW', 'Mercedes', 'Audi', 'Lamborghini', 'Porsche', 'Toyota', 'Honda', 'Ford', 'Land Rover', 'Nissan'];
  const types = ['Sedan', 'SUV', 'Coupe', 'Sports', 'Supercar', 'Electric'];

  useEffect(() => {
    fetchCars();
  }, [brand, type]);

  const fetchCars = async () => {
    setLoading(true);
    try {
      const params = {};
      if (brand) params.brand = brand;
      if (type) params.type = type;
      if (search) params.search = search;
      const { data } = await getCarsAPI(params);
      setCars(Array.isArray(data) ? data : (data?.data || []));
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCars();
  };

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            Our <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">Premium</span> Fleet
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto">Discover our handpicked collection of luxury vehicles. Find your perfect ride.</p>
        </motion.div>

        {/* Search & Filter */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-10">
          <form onSubmit={handleSearch} className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input type="text" placeholder="Search cars..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400/50" />
            </div>
            <button type="submit" className="bg-gradient-to-r from-yellow-400 to-amber-500 text-black px-6 py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-yellow-500/30 transition">Search</button>
            <button type="button" onClick={() => setShowFilters(!showFilters)} className="bg-white/10 border border-white/10 px-4 py-3 rounded-xl hover:bg-white/20 transition">
              <SlidersHorizontal className="w-5 h-5" />
            </button>
          </form>

          {showFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Brand</label>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setBrand('')} className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${!brand ? 'bg-yellow-400 text-black' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}>All Brands</button>
                  {brands.map(b => (
                    <button key={b} onClick={() => setBrand(b)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${brand === b ? 'bg-yellow-400 text-black' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}>{b}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Type</label>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setType('')} className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${!type ? 'bg-yellow-400 text-black' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}>All Types</button>
                  {types.map(t => (
                    <button key={t} onClick={() => setType(t)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${type === t ? 'bg-yellow-400 text-black' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}>{t}</button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Cars Grid */}
        {loading ? <LoadingSkeleton /> : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {cars.length > 0 ? cars.map((car, i) => (
              <motion.div key={car._id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <CarCard car={car} />
              </motion.div>
            )) : (
              <div className="col-span-4 text-center py-20 text-gray-500">
                <p className="text-xl">No cars found matching your criteria.</p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Cars;
