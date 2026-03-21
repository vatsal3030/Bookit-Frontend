import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { CardSkeleton } from '../components/ui/skeleton';
import { SearchIcon, MapPin, Star, SlidersHorizontal, Navigation, ArrowRight } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import { useToast } from '../components/ui/toast';
import { AuroraBackground } from '../components/ui/aurora-background';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';

const ALL_CATEGORIES = ['All', 'Doctor', 'Salon', 'Fitness', 'Tutor', 'Spa', 'Legal', 'Dental', 'Mechanic'];

const mapContainerStyle = { width: '100%', height: '100%' };
const defaultCenter = { lat: 23.0225, lng: 72.5714 }; // Default to Ahmedabad if no location

const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#212121" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#757575" }] },
  { featureType: "administrative.country", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
  { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#bdbdbd" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#181818" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { featureType: "poi.park", elementType: "labels.text.stroke", stylers: [{ color: "#1b1b1b" }] },
  { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#2c2c2c" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#8a8a8a" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#373737" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3c3c3c" }] },
  { featureType: "road.highway.controlled_access", elementType: "geometry", stylers: [{ color: "#4e4e4e" }] },
  { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { featureType: "transit", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#3d3d3d" }] }
];

export default function Search() {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<any>(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  });

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) setActiveCategory(cat);
  }, [searchParams]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          setMapCenter(loc);
        },
        () => {
          setUserLocation(defaultCenter);
          setMapCenter(defaultCenter);
        }
      );
    } else {
      setUserLocation(defaultCenter);
      setMapCenter(defaultCenter);
    }
  }, []);

  useEffect(() => {
    const fetchProviders = async () => {
      setLoading(true);
      try {
        const params: any = {};
        if (userLocation) {
          params.lat = userLocation.lat;
          params.lng = userLocation.lng;
        }
        if (activeCategory !== 'All') params.category = activeCategory;
        if (query) params.q = query;

        const res = await api.get('/search/providers', { params });
        setProviders(res.data.providers || res.data || []);
      } catch (err) {
        showToast('Failed to load providers', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchProviders();
  }, [activeCategory, userLocation, showToast]);

  const filtered = query
    ? providers.filter(p =>
        (p.user?.name || p.businessName || '').toLowerCase().includes(query.toLowerCase()) ||
        (p.services || []).some((s: any) => s.name?.toLowerCase().includes(query.toLowerCase()) || s.category?.toLowerCase().includes(query.toLowerCase()))
      )
    : providers;

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-20">
      
      {/* Premium Header with Aurora Background */}
      <div className="relative h-[300px] md:h-[400px] w-full overflow-hidden flex items-center justify-center">
        <AuroraBackground className="absolute inset-0" showRadialGradient={true}>
          <div className="hidden" /> {/* Dummy child */}
        </AuroraBackground>
        
        <div className="relative z-10 w-full max-w-4xl mx-auto px-4 mt-16 text-center">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight drop-shadow-xl text-white">
              Discover Experts <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Nearby</span>
            </h1>
            <p className="text-gray-200 text-lg md:text-xl max-w-2xl mx-auto font-medium drop-shadow-md">
              Find and book trusted service providers in your exact location instantly
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8 max-w-2xl mx-auto"
          >
            <div className="bg-white/10 backdrop-blur-xl p-2 rounded-2xl border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex gap-2 transition-all focus-within:bg-white/15 focus-within:border-white/30">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  className="pl-12 h-14 text-lg rounded-xl border-0 bg-transparent text-white placeholder:text-gray-400 focus-visible:ring-0"
                  placeholder="What service do you need?"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <Button className="h-14 px-8 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-lg shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:shadow-[0_0_30px_rgba(79,70,229,0.6)] transition-all">
                Search
              </Button>
            </div>
            
            {userLocation && (
              <div className="flex items-center justify-center gap-2 mt-4 text-sm text-cyan-300 drop-shadow-md font-medium">
                <Navigation className="w-4 h-4 animate-pulse" />
                <span>Showing results near your active location</span>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-8">
        {/* Category Chips */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {ALL_CATEGORIES.map((cat, i) => (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + (i * 0.05) }}
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                activeCategory === cat
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)] border-transparent scale-105'
                  : 'bg-white/5 text-gray-300 hover:bg-white/15 hover:text-white border border-white/10 hover:border-white/20'
              }`}
            >
              {cat}
            </motion.button>
          ))}
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-64 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md animate-pulse"></div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20 max-w-md mx-auto bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl">
            <SlidersHorizontal className="w-16 h-16 mx-auto mb-6 text-gray-500" />
            <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">No match found</h3>
            <p className="text-gray-400">Try adjusting your search query or exploring different categories to find what you need.</p>
          </motion.div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Column: Result List */}
            <div className="lg:w-1/2 xs:w-full space-y-6">
              <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <AnimatePresence>
                  {filtered.map((provider, i) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: i * 0.05, duration: 0.4 }}
                      key={provider.id}
                      className="relative group cursor-pointer overflow-hidden rounded-3xl bg-zinc-900 border border-white/10 hover:border-blue-500/50 transition-colors shadow-2xl"
                      onClick={() => navigate(`/providers/${provider.id}`)}
                      onMouseEnter={() => {
                        if (provider.lat && provider.lng) {
                          setMapCenter({ lat: provider.lat, lng: provider.lng });
                        }
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      
                      <div className="relative p-6 flex flex-col h-full z-10">
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shrink-0 shadow-[0_0_20px_rgba(79,70,229,0.4)]">
                              {(provider.user?.name || provider.businessName || 'P').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors tracking-tight line-clamp-1">
                                {provider.user?.name || provider.businessName || 'Provider'}
                              </h3>
                              {provider.businessName && provider.businessName !== provider.user?.name && (
                                <p className="text-xs text-gray-400 font-medium line-clamp-1">{provider.businessName}</p>
                              )}
                            </div>
                          </div>
                          {provider.isVerified && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">Verified</span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 mb-4">
                          <div className="flex items-center gap-1.5 bg-yellow-500/10 px-2 py-0.5 rounded-lg">
                            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                            <span className="text-sm font-bold text-yellow-400">{provider.rating?.toFixed(1) || '0.0'}</span>
                          </div>
                          <span className="text-xs text-gray-500 font-medium">({provider.reviewCount || provider._count?.reviews || 0} reviews)</span>
                        </div>

                        {provider.address && (
                          <p className="text-sm text-gray-400 mb-5 flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                            <span className="line-clamp-2 leading-relaxed">{provider.address}</span>
                          </p>
                        )}

                        {/* Price Range & CTA */}
                        <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-auto">
                          <div>
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold block mb-1">Starting from</span>
                            {provider.services?.length > 0 ? (
                              <span className="text-lg font-bold text-white flex items-center">
                                <span className="text-blue-400 mr-1">₹</span>
                                {Math.min(...(provider.services || []).map((s: any) => s.baseFee || 0))}
                              </span>
                            ) : (
                              <span className="text-xs font-medium text-gray-500">No active services</span>
                            )}
                          </div>
                          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Right Column: Google Map */}
            <div className="lg:w-1/2 xs:w-full h-[500px] lg:h-[calc(100vh-120px)] sticky top-24 rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-zinc-900 flex items-center justify-center">
              {isLoaded ? (
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={mapCenter}
                  zoom={12}
                  options={{
                    styles: darkMapStyle,
                    disableDefaultUI: true,
                    zoomControl: true,
                  }}
                >
                  {userLocation && (
                    <Marker
                      position={userLocation}
                      icon={{
                        url: 'https://cdn-icons-png.flaticon.com/512/3204/3204010.png',
                        scaledSize: new window.google.maps.Size(30, 30),
                      }}
                    />
                  )}
                  {filtered.map(provider => {
                    if (!provider.lat || !provider.lng) return null;
                    return (
                      <Marker
                        key={`marker-${provider.id}`}
                        position={{ lat: provider.lat, lng: provider.lng }}
                        onClick={() => setSelectedMarker(provider)}
                        icon={{
                          url: 'https://cdn-icons-png.flaticon.com/512/2776/2776067.png',
                          scaledSize: new window.google.maps.Size(35, 35),
                        }}
                      />
                    );
                  })}

                  {selectedMarker && (
                    <InfoWindow
                      position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
                      onCloseClick={() => setSelectedMarker(null)}
                    >
                      <div className="p-2 text-gray-900 max-w-xs">
                        <h4 className="font-bold text-md mb-1">{selectedMarker.businessName || selectedMarker.user?.name}</h4>
                        <p className="text-xs text-gray-600 mb-2">{selectedMarker.address}</p>
                        <Button 
                          size="sm" 
                          onClick={() => navigate(`/providers/${selectedMarker.id}`)}
                          className="w-full h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          View Profile
                        </Button>
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              ) : (
                <div className="flex flex-col items-center text-gray-400">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                  <p>Loading Map...</p>
                  <p className="text-xs mt-2 text-gray-500 text-center px-8">
                    If this persists, ensure your map API key is set in .env
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
