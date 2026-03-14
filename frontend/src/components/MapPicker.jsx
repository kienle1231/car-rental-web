import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';

const defaultCenter = { lat: 16.0544, lng: 108.2022 };

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const MapPicker = ({ pickup, dropoff, onSelectPickup, onSelectDropoff, height = '320px', label = 'Pickup & dropoff' }) => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  });

  const handleClick = (event) => {
    const coords = { lat: event.latLng.lat(), lng: event.latLng.lng() };
    if (!pickup) {
      onSelectPickup?.(coords);
      return;
    }
    if (!dropoff) {
      onSelectDropoff?.(coords);
      return;
    }
    onSelectPickup?.(coords);
    onSelectDropoff?.(null);
  };

  const center = pickup || dropoff || defaultCenter;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      <div className="flex flex-col gap-1 px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <MapPin className="w-4 h-4 text-yellow-400" /> {label}
        </div>
        <div className="text-xs text-gray-500">
          {pickup ? `Pickup: ${pickup.lat.toFixed(4)}, ${pickup.lng.toFixed(4)}` : 'Click map to set pickup'}
          {dropoff ? ` · Dropoff: ${dropoff.lat.toFixed(4)}, ${dropoff.lng.toFixed(4)}` : ''}
        </div>
      </div>
      <div style={{ height }} className="w-full">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            zoom={pickup || dropoff ? 12 : 11}
            center={center}
            onClick={handleClick}
            options={{
              disableDefaultUI: true,
              zoomControl: true,
              styles: [
                { elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
                { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
                { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
                { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#e2e8f0' }] },
                { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
                { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#0b1220' }] },
                { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
                { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
                { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#334155' }] },
                { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
                { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#1f2a44' }] },
                { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2a44' }] },
                { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#e2e8f0' }] },
                { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0b1220' }] },
                { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] }
              ]
            }}
          >
            {pickup && (
              <Marker
                position={pickup}
                label={{ text: 'P', color: '#111827', fontWeight: '700' }}
                icon={{ url: 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png' }}
              />
            )}
            {dropoff && (
              <Marker
                position={dropoff}
                label={{ text: 'D', color: '#111827', fontWeight: '700' }}
                icon={{ url: 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png' }}
              />
            )}
          </GoogleMap>
        ) : (
          <div className="h-full w-full flex items-center justify-center text-gray-500">Loading map…</div>
        )}
      </div>
    </motion.div>
  );
};

export default MapPicker;
