import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Search, Loader2 } from 'lucide-react';
import { Input } from './input';
import { Button } from './button';

// Fix for default marker icons in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapPickerProps {
  defaultLocation?: { lat: number; lng: number };
  onChange?: (location: { lat: number; lng: number }) => void;
  readOnly?: boolean;
}

const DEFAULT_CENTER = { lat: 23.0225, lng: 72.5714 }; // Ahmedabad

// Component to handle map clicks
function LocationMarker({ position, setPosition, readOnly, onChange }: any) {
  useMapEvents({
    click(e: any) {
      if (!readOnly) {
        setPosition(e.latlng);
        if (onChange) onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    },
  });

  return position === null ? null : <Marker position={position}></Marker>;
}

// Component to dynamically change map center
function MapUpdater({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], map.getZoom(), { animate: true });
  }, [center, map]);
  return null;
}

export function MapPicker({ defaultLocation, onChange, readOnly = false }: MapPickerProps) {
  const [position, setPosition] = useState<any>(defaultLocation || null);
  const [center, setCenter] = useState(defaultLocation || DEFAULT_CENTER);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const newPos = { lat: parseFloat(lat), lng: parseFloat(lon) };
        setCenter(newPos);
        if (!readOnly) {
          setPosition(newPos);
          if (onChange) onChange(newPos);
        }
      }
    } catch (err) {
      console.error('Geocoding failed', err);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full h-full relative z-0">
      {!readOnly && (
        <div className="flex gap-2 z-10 relative">
          <Input 
            placeholder="Search for an address or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 bg-zinc-900 border-white/10 text-white"
          />
          <Button onClick={handleSearch} disabled={searching} className="bg-blue-600 hover:bg-blue-700">
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>
      )}
      <div className="flex-1 w-full rounded-2xl overflow-hidden border border-white/10 shadow-xl min-h-[300px] relative z-0">
        <MapContainer center={[center.lat, center.lng]} zoom={13} style={{ height: '100%', width: '100%', zIndex: 0 }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {position && <LocationMarker position={position} setPosition={setPosition} readOnly={readOnly} onChange={onChange} />}
          <MapUpdater center={center} />
        </MapContainer>
      </div>
    </div>
  );
}
