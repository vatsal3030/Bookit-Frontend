import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Button } from '../components/ui/button';
import { SearchIcon, MapPin, Star, SlidersHorizontal, Navigation, ArrowRight, Map, List, Loader2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api, { deduplicatedGet } from '../lib/api';
import { useToast } from '../components/ui/toast';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import SEO from '../components/SEO';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const userIcon = new L.Icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/512/3204/3204010.png', iconSize: [30, 30], iconAnchor: [15, 30] });

const categoryIcons: Record<string, string> = {
  'Healthcare': 'https://cdn-icons-png.flaticon.com/512/2966/2966327.png',
  'Beauty & Wellness': 'https://cdn-icons-png.flaticon.com/512/1940/1940922.png',
  'Home Services': 'https://cdn-icons-png.flaticon.com/512/1009/1009033.png',
  'Education': 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
  'Fitness': 'https://cdn-icons-png.flaticon.com/512/2548/2548596.png',
  'Legal': 'https://cdn-icons-png.flaticon.com/512/5759/5759606.png',
  'Finance': 'https://cdn-icons-png.flaticon.com/512/2933/2933116.png',
  'Other': 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
};

const getProviderIcon = (category?: string) => {
  const url = category && categoryIcons[category] ? categoryIcons[category] : categoryIcons['Other'];
  return new L.Icon({ iconUrl: url, iconSize: [30, 30], iconAnchor: [15, 30] });
};

const ALL_CATEGORIES = ['All', 'Healthcare', 'Beauty & Wellness', 'Home Services', 'Education', 'Fitness', 'Legal', 'Finance', 'Other'];
const defaultCenter = { lat: 23.0225, lng: 72.5714 };

function MapUpdater({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    if (map) {
      try { map.setView([center.lat, center.lng], map.getZoom(), { animate: true }); } catch {}
    }
  }, [center, map]);
  return null;
}

export default function Search() {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [viewMode, setViewMode] = useState<'split' | 'map' | 'list'>('split');
  const [sortBy, setSortBy] = useState('distance'); // 'distance' | 'rating'
  const [maxDistance, setMaxDistance] = useState(50); // km
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce the query so API calls fire 400ms after the user stops typing
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(query), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);
  const { showToast } = useToast();

  // Stable key for MapContainer to prevent _leaflet_pos crash on re-render
  const mapKey = useMemo(() => `map-${mapCenter.lat.toFixed(4)}-${mapCenter.lng.toFixed(4)}`, []);

  useEffect(() => { const cat = searchParams.get('category'); if (cat) setActiveCategory(cat); }, [searchParams]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        p => { const loc = { lat: p.coords.latitude, lng: p.coords.longitude }; setUserLocation(loc); setMapCenter(loc); },
        () => { setUserLocation(defaultCenter); setMapCenter(defaultCenter); }
      );
    } else { setUserLocation(defaultCenter); setMapCenter(defaultCenter); }
  }, []);

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (userLocation) { params.lat = userLocation.lat; params.lng = userLocation.lng; }
      if (activeCategory !== 'All') params.category = activeCategory;
      if (debouncedQuery) params.q = debouncedQuery;
      params.sortBy = sortBy;
      params.maxDistance = maxDistance;
      const res = await deduplicatedGet('/search/providers', params);
      setProviders((res as any).providers || res || []);
    } catch { showToast('Failed to load providers', 'error'); }
    finally { setLoading(false); }
  }, [userLocation, activeCategory, debouncedQuery, sortBy, maxDistance, showToast]);

  useEffect(() => { fetchProviders(); }, [fetchProviders]);

  const handleSearch = () => { setDebouncedQuery(query); };

  const filtered = providers; // Filter logic is now safely handled natively via Backend (searchController.ts)

  const MapSection = useMemo(() => (
    <MapContainer
      key={mapKey}
      center={[mapCenter.lat, mapCenter.lng]}
      zoom={12}
      style={{ height: '100%', width: '100%' }}
      className="rounded-xl"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapUpdater center={mapCenter} />
      {userLocation && (
        <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
          <Popup><div className="text-gray-900 text-sm font-semibold">📍 Your Location</div></Popup>
        </Marker>
      )}
      {filtered.map(provider => {
        if (!provider.lat || !provider.lng) return null;
        return (
          <Marker key={`m-${provider.id}`} position={[provider.lat, provider.lng]} icon={getProviderIcon(provider.category || provider?.services?.[0]?.category)}>
            <Popup>
              <div className="p-1 text-gray-900 min-w-[180px]">
                <h4 className="font-bold text-sm mb-1">{provider.businessName || provider.user?.name}</h4>
                <div className="flex items-center gap-1 text-yellow-500 mb-1 text-xs font-bold">
                  <Star className="w-3 h-3 fill-yellow-500" />{provider.rating?.toFixed(1) || '0.0'}
                </div>
                <p className="text-xs text-gray-500 mb-2">{provider.address}</p>
                <button
                  onClick={() => navigate(`/providers/${provider.id}`)}
                  className="w-full px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700"
                >View Profile</button>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  ), [mapKey, mapCenter, userLocation, filtered, navigate]);

  return (
    <>
      <SEO title="Find Services" description="Search and discover the best local service providers near you on Bookit." />
      <div className="pt-16 min-h-screen bg-gray-50 pb-12">
        {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Discover Experts <span className="text-blue-600">Nearby</span>
          </h1>
          <p className="text-gray-500 text-sm sm:text-base max-w-lg mx-auto mb-6">
            Find and book trusted service providers near you
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 outline-none border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                placeholder="What service do you need?"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button variant="primary" className="px-6 py-3 sm:w-auto w-full" onClick={handleSearch}>
              <SearchIcon className="w-4 h-4" /> Search
            </Button>
          </div>

          {userLocation && (
            <div className="flex items-center justify-center gap-1.5 mt-3 text-xs sm:text-sm text-blue-600">
              <Navigation className="w-3.5 h-3.5" />
              <span>Showing results near your location</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-5">
        {/* Category Chips + View Toggle */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div className="flex flex-wrap gap-2">
            {ALL_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors border ${
                  activeCategory === cat
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 flex-shrink-0">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <List className="w-3.5 h-3.5" /> List
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === 'split' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              Split
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === 'map' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <Map className="w-3.5 h-3.5" /> Map
            </button>
          </div>
        </div>

        {/* Deep Filters Row */}
        {viewMode !== 'map' && (
          <div className="flex items-center gap-4 mb-6 bg-white p-3 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500">Sort by:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="text-xs border-gray-300 rounded focus:ring-blue-500 bg-gray-50 py-1 pl-2 pr-6"
              >
                <option value="distance">Nearest to me</option>
                <option value="rating">Highest Rated</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
              </select>
            </div>
            <div className="flex items-center gap-2 flex-1 max-w-[200px]">
              <span className="text-xs font-medium text-gray-500 whitespace-nowrap">Radius:</span>
              <select
                value={maxDistance}
                onChange={e => setMaxDistance(parseInt(e.target.value))}
                className="w-full text-xs border border-gray-300 rounded focus:ring-blue-500 bg-gray-50 py-1 pl-2 pr-6 appearance-none cursor-pointer"
              >
                <option value={5}>5 km</option>
                <option value={10}>10 km</option>
                <option value={25}>25 km</option>
                <option value={50}>50 km</option>
                <option value={100}>100 km</option>
                <option value={500}>500 km</option>
                <option value={2000}>2000 km</option>
                <option value={50000}>Anywhere</option>
              </select>
            </div>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-44 rounded-xl bg-white border border-gray-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Full Map View */}
            {viewMode === 'map' && (
              <div className="fixed inset-0 z-[100] bg-white flex flex-col overflow-hidden">
                <div className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm z-10 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <Map className="w-5 h-5 text-blue-600" />
                     <h2 className="font-bold text-gray-900 text-lg">Interactive Map Discovery</h2>
                   </div>
                   <Button variant="outline" size="sm" onClick={() => setViewMode('split')}>
                     Exit Map
                   </Button>
                </div>
                <div className="flex-1 w-full h-full relative z-0">
                  {MapSection}
                </div>
              </div>
            )}

            {/* List or Split View */}
            {viewMode !== 'map' && (
              filtered.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl p-10 sm:p-12 text-center max-w-md mx-auto">
                  <SlidersHorizontal className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                  <h3 className="font-semibold text-gray-900 mb-1">No providers found</h3>
                  <p className="text-sm text-gray-400">Try a different search or category.</p>
                </div>
              ) : (
                <div className={`flex flex-col ${viewMode === 'split' ? 'lg:flex-row' : ''} gap-5`}>
                  {/* Provider Cards */}
                  <div className={`${viewMode === 'split' ? 'lg:w-1/2' : 'w-full'} space-y-3`}>
                    <p className="text-sm text-gray-500 mb-1">{filtered.length} provider{filtered.length !== 1 ? 's' : ''} found</p>
                    {filtered.map(provider => (
                      <div
                        key={provider.id}
                        className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 hover:shadow-md transition-all cursor-pointer group"
                        onClick={() => navigate(`/providers/${provider.id}`)}
                        onMouseEnter={() => { if (provider.lat && provider.lng) setMapCenter({ lat: provider.lat, lng: provider.lng }); }}
                        tabIndex={0}
                        role="article"
                        onKeyDown={e => e.key === 'Enter' && navigate(`/providers/${provider.id}`)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                              {(provider.user?.name || provider.businessName || 'P').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-sm sm:text-base">
                                {provider.user?.name || provider.businessName || 'Provider'}
                              </h3>
                              {provider.businessName && provider.businessName !== provider.user?.name && (
                                <p className="text-xs text-gray-400">{provider.businessName}</p>
                              )}
                            </div>
                          </div>
                          {provider.isVerified && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 font-medium flex-shrink-0">Verified</span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded-lg">
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                            <span className="text-xs font-bold text-yellow-600">{provider.rating?.toFixed(1) || '0.0'}</span>
                          </div>
                          <span className="text-xs text-gray-400">({provider.reviewCount || provider._count?.reviews || 0} reviews)</span>
                          {provider.distance != null && (
                            <span className="text-xs text-blue-600 font-medium">{provider.distance} km away</span>
                          )}
                        </div>

                        {provider.address && (
                          <p className="text-xs sm:text-sm text-gray-500 mb-2 flex items-start gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{provider.address}</span>
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <div>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">From</span>
                            {provider.services?.length > 0 ? (
                              <p className="text-sm sm:text-base font-bold text-gray-900">₹{Math.min(...(provider.services || []).map((s: any) => s.baseFee || 0))}</p>
                            ) : (
                              <p className="text-xs text-gray-400">No services</p>
                            )}
                          </div>
                          <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                            <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-white transition-colors" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Side Map (split view only) */}
                  {viewMode === 'split' && (
                    <div className="lg:w-1/2 h-[400px] lg:h-[calc(100vh-280px)] lg:sticky lg:top-20 rounded-xl overflow-hidden border border-gray-200 shadow-sm hidden lg:block">
                      {MapSection}
                    </div>
                  )}
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
    </>
  );
}
