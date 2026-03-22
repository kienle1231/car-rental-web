import { useState, useEffect, useMemo } from 'react';
import ReactCalendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Users, Fuel, Settings, MapPin, ArrowLeft, X, Maximize2, Navigation, ShieldCheck, ShieldAlert, CarTaxiFront, Baby, Calendar as CalendarIcon } from 'lucide-react';
import { getCarByIdAPI, getAvailabilityByCarAPI, getCarPricingAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const tabs = ['Description', 'Specifications', 'Reviews'];

const CarDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [activeTab, setActiveTab] = useState('Description');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [booking, setBooking] = useState({
    pickupDate: '',
    returnDate: '',
    pickupLocation: '',
    pickupLocationCoords: null,
    dropoffLocationCoords: null,
    distanceKm: 0,
    addOns: [],
    paymentStatus: 'pending'
  });
  const [distanceLoading, setDistanceLoading] = useState(false);
  const [bookedDates, setBookedDates] = useState([]);
  const [pricing, setPricing] = useState(null);
  const [pricingLoading, setPricingLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [{ data }, availabilityRes] = await Promise.all([
          getCarByIdAPI(id),
          getAvailabilityByCarAPI(id)
        ]);
        setCar(data);
        setBooking((prev) => ({
          ...prev,
          pickupLocation: data.location || prev.pickupLocation,
          pickupLocationCoords: data.pickupLocationCoords || prev.pickupLocationCoords,
          dropoffLocationCoords: data.pickupLocationCoords || prev.dropoffLocationCoords
        }));
        setBookedDates(availabilityRes.data || []);
      } catch (err) { console.error(err); }
      setLoading(false);
    })();
  }, [id]);

  useEffect(() => {
    const loadPricing = async () => {
      if (!booking.pickupDate || !booking.returnDate) return;
      setPricingLoading(true);
      try {
        const { data } = await getCarPricingAPI(id, {
          startDate: booking.pickupDate,
          endDate: booking.returnDate
        });
        setPricing(data);
      } catch (error) {
        console.error(error);
      } finally {
        setPricingLoading(false);
      }
    };

    loadPricing();
  }, [booking.pickupDate, booking.returnDate, id]);

  const images = useMemo(() => {
    if (!car) return [];
    const gallery = Array.isArray(car.galleryImages) ? car.galleryImages : [];
    return [car.imageUrl, ...gallery].filter(Boolean);
  }, [car]);

  const addOnOptions = [
    { id: 'basic_insurance', label: 'Basic Insurance', price: 12 },
    { id: 'premium_insurance', label: 'Premium Insurance', price: 28 },
    { id: 'gps', label: 'GPS Navigation', price: 8 },
    { id: 'child_seat', label: 'Child Seat', price: 6 }
  ];

  const days = booking.pickupDate && booking.returnDate
    ? Math.max(1, Math.ceil((new Date(booking.returnDate) - new Date(booking.pickupDate)) / 86400000))
    : 0;

  const addOnsTotal = addOnOptions
    .filter((option) => booking.addOns.includes(option.id))
    .reduce((sum, option) => sum + option.price * (days || 1), 0);

  const dynamicPerDay = pricing?.dynamicPricePerDay || (car ? car.pricePerDay : 0);
  const basePerDay = pricing?.basePrice || (car ? car.pricePerDay : 0);
  const totalPrice = car ? days * dynamicPerDay + addOnsTotal : 0;

  const bookedRanges = useMemo(() => bookedDates.map((bookingItem) => ({
    start: new Date(bookingItem.pickupDate),
    end: new Date(bookingItem.returnDate)
  })), [bookedDates]);

  const isDateBooked = (date) => {
    return bookedRanges.some((range) => date >= range.start && date <= range.end);
  };

  const handleCalendarChange = (range) => {
    if (!Array.isArray(range)) return;
    const [start, end] = range;
    if (!start || !end) return;
    if (isDateBooked(start) || isDateBooked(end)) {
      toast.error('Selected dates include unavailable days');
      return;
    }
    setBooking((prev) => ({
      ...prev,
      pickupDate: start.toISOString().split('T')[0],
      returnDate: end.toISOString().split('T')[0]
    }));
  };

  useEffect(() => {
    if (!booking.pickupLocationCoords || !booking.dropoffLocationCoords) {
      if (booking.pickupLocationCoords) {
        setBooking((prev) => ({ ...prev, dropoffLocationCoords: prev.dropoffLocationCoords || prev.pickupLocationCoords, distanceKm: 0 }));
      }
      return;
    }
    if (!window.google?.maps?.DistanceMatrixService) return;
    setDistanceLoading(true);
    const service = new window.google.maps.DistanceMatrixService();
    service.getDistanceMatrix(
      {
        origins: [booking.pickupLocationCoords],
        destinations: [booking.dropoffLocationCoords],
        travelMode: window.google.maps.TravelMode.DRIVING
      },
      (response, status) => {
        if (status === 'OK') {
          const element = response.rows[0]?.elements?.[0];
          if (element?.status === 'OK') {
            const distance = element.distance?.value ? element.distance.value / 1000 : 0;
            setBooking((prev) => ({ ...prev, distanceKm: Number(distance.toFixed(1)) }));
          }
        }
        setDistanceLoading(false);
      }
    );
  }, [booking.pickupLocationCoords, booking.dropoffLocationCoords]);

  const handleAddOnToggle = (id) => {
    setBooking((prev) => {
      const exists = prev.addOns.includes(id);
      return { ...prev, addOns: exists ? prev.addOns.filter((item) => item !== id) : [...prev.addOns, id] };
    });
  };

  const handleBook = async () => {
    if (!user) { toast.error('Please login first'); navigate('/login'); return; }
    if (!booking.pickupDate || !booking.returnDate || !booking.pickupLocation) { toast.error('Please fill all fields'); return; }
    if (isDateBooked(new Date(booking.pickupDate)) || isDateBooked(new Date(booking.returnDate))) {
      toast.error('Selected dates are not available');
      return;
    }

    const checkoutPayload = {
      carId: id,
      booking: {
        ...booking,
        totalPrice
      },
      carSnapshot: {
        name: car.name,
        brand: car.brand,
        model: car.model,
        imageUrl: car.imageUrl,
        pricePerDay: basePerDay,
        dynamicPricePerDay: dynamicPerDay
      },
      addOnsTotal,
      days
    };

    sessionStorage.setItem('checkoutPayload', JSON.stringify(checkoutPayload));
    navigate('/checkout', { state: checkoutPayload });
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="animate-pulse space-y-8">
            <div className="h-6 w-40 bg-white/10 rounded-full" />
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-10">
              <div className="space-y-6">
                <div className="h-[440px] bg-white/10 rounded-3xl" />
                <div className="grid grid-cols-4 gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-20 bg-white/10 rounded-2xl" />
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <div className="h-10 w-56 bg-white/10 rounded-full" />
                <div className="h-6 w-40 bg-white/10 rounded-full" />
                <div className="h-24 bg-white/10 rounded-2xl" />
                <div className="h-64 bg-white/10 rounded-3xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!car) return <div className="min-h-screen pt-24 flex items-center justify-center text-gray-500">Car not found</div>;

  return (
    <div className="pt-24 pb-16 min-h-screen lux-calendar-theme">
      <div className="max-w-7xl mx-auto px-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-yellow-400 transition mb-8">
          <ArrowLeft className="w-5 h-5" /> Back to Cars
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-10 items-start">
          {/* Gallery */}
          <div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-3xl overflow-hidden bg-white/5 border border-white/10">
              <img src={images[activeImage]} alt={car.name} className="w-full h-[420px] md:h-[520px] object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <button onClick={() => setIsPreviewOpen(true)} className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 transition text-white px-3 py-2 rounded-full flex items-center gap-2 text-xs">
                <Maximize2 className="w-4 h-4" /> Fullscreen
              </button>
              <div className="absolute bottom-4 left-4 bg-yellow-400 text-black px-4 py-2 rounded-full font-bold flex items-center gap-1">
                <Star className="w-4 h-4" fill="currentColor" /> {car.rating}
              </div>
            </motion.div>

            <div className="mt-5 grid grid-cols-4 gap-3">
              {images.slice(0, 4).map((img, index) => (
                <button
                  key={img}
                  onClick={() => setActiveImage(index)}
                  className={`relative rounded-2xl overflow-hidden border transition ${index === activeImage ? 'border-yellow-400 shadow-lg shadow-yellow-500/20' : 'border-white/10 hover:border-white/30'}`}
                >
                  <img src={img} alt={`${car.name} ${index}`} className="w-full h-20 object-cover" />
                  <div className="absolute inset-0 bg-black/20" />
                </button>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: <Users className="w-4 h-4" />, label: `${car.seats} Seats` },
                { icon: <Settings className="w-4 h-4" />, label: car.transmission },
                { icon: <Fuel className="w-4 h-4" />, label: car.fuelType },
                { icon: <MapPin className="w-4 h-4" />, label: car.location || 'Global' },
              ].map((item, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                  <div className="text-yellow-400 flex justify-center mb-2">{item.icon}</div>
                  <p className="text-sm text-gray-400">{item.label}</p>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="mt-10">
              <div className="flex flex-wrap gap-3 mb-6">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition ${activeTab === tab ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-500/30' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {activeTab === 'Description' && (
                  <motion.div key="desc" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="text-gray-400 leading-relaxed">
                    {car.description}
                  </motion.div>
                )}
                {activeTab === 'Specifications' && (
                  <motion.div key="spec" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { label: 'Brand', value: car.brand },
                      { label: 'Model', value: car.model || car.name },
                      { label: 'Year', value: car.year || '2024' },
                      { label: 'Seats', value: car.seats },
                      { label: 'Transmission', value: car.transmission },
                      { label: 'Fuel Type', value: car.fuelType },
                      { label: 'Location', value: car.location || 'Global' },
                      { label: 'Rating', value: car.rating },
                    ].map((item) => (
                      <div key={item.label} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                        <span className="text-sm text-gray-400">{item.label}</span>
                        <span className="text-sm font-semibold text-white">{item.value}</span>
                      </div>
                    ))}
                  </motion.div>
                )}
                {activeTab === 'Reviews' && (
                  <motion.div key="reviews" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                    {[
                      { name: 'Ava L.', rating: 5, text: 'Flawless experience. The car felt brand new and the pickup was effortless.' },
                      { name: 'Noah R.', rating: 5, text: 'Luxury service, seamless booking, and an incredible ride.' },
                      { name: 'Mia K.', rating: 4.8, text: 'Premium feel throughout. Would book again for special trips.' },
                    ].map((review) => (
                      <div key={review.name} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">{review.name}</span>
                          <span className="flex items-center gap-1 text-yellow-400 text-sm"><Star className="w-4 h-4" fill="currentColor" /> {review.rating}</span>
                        </div>
                        <p className="text-sm text-gray-400">{review.text}</p>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Booking Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:sticky lg:top-28">
            <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-3xl p-6 space-y-6">
              <div>
                <span className="bg-yellow-400/10 text-yellow-400 px-4 py-1.5 rounded-full text-sm font-medium">{car.brand} {car.model}</span>
                <h1 className="text-3xl font-black mt-4">{car.name}</h1>
                <p className="text-sm text-gray-500 mt-2">{car.location || 'Global'} • {car.year || '2024'} • {car.transmission}</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-yellow-400" /> Pickup location
                </div>
                <div className="mt-2 text-xs text-gray-500">{car.location || 'Global'}</div>
              </div>

              <div className="text-3xl font-black">
                <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">{car.pricePerDay.toLocaleString()} VNĐ</span>
                <span className="text-sm text-gray-500 font-normal"> /day</span>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block flex items-center gap-1"><CalendarIcon className="w-4 h-4" /> Select Dates</label>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <ReactCalendar
                    selectRange
                    minDate={new Date()}
                    value={booking.pickupDate && booking.returnDate ? [new Date(booking.pickupDate), new Date(booking.returnDate)] : null}
                    onChange={handleCalendarChange}
                    tileDisabled={({ date }) => isDateBooked(date)}
                    className="lux-calendar"
                  />
                </div>
              </div>

              <div className="bg-black/40 border border-white/10 rounded-2xl p-4">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>${car.pricePerDay} × {days || 0} day{days === 1 ? '' : 's'}</span>
                  <span className="text-white font-bold">${totalPrice}</span>
                </div>
                <div className="flex justify-between text-lg font-black">
                  <span>Total</span>
                  <span className="text-yellow-400">${totalPrice}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-gray-400 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2"><Navigation className="w-4 h-4 text-yellow-400" /> Pickup</span>
                    <span>{booking.pickupLocationCoords ? `${booking.pickupLocationCoords.lat.toFixed(4)}, ${booking.pickupLocationCoords.lng.toFixed(4)}` : (car?.location || 'Global')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2"><Navigation className="w-4 h-4 text-orange-400" /> Dropoff</span>
                    <span>{booking.dropoffLocationCoords ? `${booking.dropoffLocationCoords.lat.toFixed(4)}, ${booking.dropoffLocationCoords.lng.toFixed(4)}` : (car?.location || 'Global')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2"><Navigation className="w-4 h-4 text-green-400" /> Distance</span>
                    <span>{distanceLoading ? 'Calculating…' : booking.distanceKm ? `${booking.distanceKm} km` : '0 km'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-gray-400">Add-ons & Insurance</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {addOnOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleAddOnToggle(option.id)}
                      className={`border rounded-2xl px-4 py-3 text-sm flex items-center justify-between transition ${booking.addOns.includes(option.id)
                        ? 'border-yellow-400/60 bg-yellow-400/10 text-yellow-300'
                        : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/30'}`}
                    >
                      <span className="flex items-center gap-2">
                        {option.id === 'basic_insurance' && <ShieldCheck className="w-4 h-4" />}
                        {option.id === 'premium_insurance' && <ShieldAlert className="w-4 h-4" />}
                        {option.id === 'gps' && <CarTaxiFront className="w-4 h-4" />}
                        {option.id === 'child_seat' && <Baby className="w-4 h-4" />}
                        {option.label}
                      </span>
                      <span className="text-xs text-gray-500">+${option.price}/day</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-black/40 border border-white/10 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Base price</span>
                  <span className="text-white font-bold">${basePerDay}/day</span>
                </div>
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Dynamic price</span>
                  <span className="text-white font-bold">
                    {pricingLoading ? '...' : `$${dynamicPerDay}/day`}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Add-ons</span>
                  <span className="text-white font-bold">${addOnsTotal}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Selected days</span>
                  <span className="text-white font-bold">{days || 0} days</span>
                </div>
                <div className="flex justify-between text-lg font-black pt-2 border-t border-white/10">
                  <span>Total</span>
                  <span className="text-yellow-400">${totalPrice}</span>
                </div>
              </div>

              {pricing?.demandIndicators && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-gray-400 space-y-2">
                  <p className="text-white font-semibold">Demand insights</p>
                  <div className="flex flex-wrap gap-2">
                    {pricing.demandIndicators.highDemand && (
                      <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-300">High demand</span>
                    )}
                    {pricing.demandIndicators.limitedAvailability && (
                      <span className="px-3 py-1 rounded-full bg-yellow-400/20 text-yellow-300">Limited availability</span>
                    )}
                    {pricing.demandIndicators.popularCar && (
                      <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300">Popular car</span>
                    )}
                  </div>
                </div>
              )}

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleBook}
                className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 text-black py-4 rounded-xl font-bold text-lg shadow-lg shadow-yellow-500/25 hover:shadow-yellow-500/40 transition">
                Continue to Payment
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {isPreviewOpen && (
          <motion.div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-6"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button onClick={() => setIsPreviewOpen(false)} className="absolute top-6 right-6 text-white/70 hover:text-white transition">
              <X className="w-6 h-6" />
            </button>
            <motion.img
              key={images[activeImage]}
              src={images[activeImage]}
              alt={car.name}
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="max-h-[80vh] w-auto rounded-3xl shadow-2xl"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CarDetail;
