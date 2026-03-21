import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { CardSkeleton } from '../../components/ui/skeleton';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/toast';
import api from '../../lib/api';
import { Star, MapPin, Clock, DollarSign, Calendar, ChevronLeft, ShieldCheck, Loader2 } from 'lucide-react';

export default function ProviderProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [provider, setProvider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);

  // Fetch provider profile
  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(`/providers/${id}`);
        setProvider(res.data.provider);
        setReviews(res.data.provider.reviews || []);
      } catch {
        showToast('Provider not found', 'error');
        navigate('/search');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  // Fetch time slots when date changes
  useEffect(() => {
    if (!selectedDate || !id) return;
    const fetchSlots = async () => {
      setSlotsLoading(true);
      try {
        const res = await api.get(`/providers/${id}/slots`, { params: { date: selectedDate } });
        setSlots(res.data.slots || []);
      } catch {
        setSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    };
    fetchSlots();
  }, [selectedDate, id]);

  // Fetch reviews
  useEffect(() => {
    if (!id) return;
    api.get(`/reviews/provider/${id}`).then(res => {
      setReviews(res.data.reviews || []);
    }).catch(() => {});
  }, [id]);

  const handleBook = async () => {
    if (!isAuthenticated) {
      showToast('Please sign in to book an appointment', 'info');
      navigate('/login');
      return;
    }
    if (!selectedService || !selectedSlot) {
      showToast('Please select a service and time slot', 'error');
      return;
    }

    setBooking(true);
    try {
      const res = await api.post('/appointments', {
        providerId: id,
        serviceId: selectedService,
        timeSlotId: selectedSlot,
      });
      showToast('Appointment booked! Proceed to payment.', 'success');
      navigate(`/checkout/${res.data.appointment.id}`);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Booking failed', 'error');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6 md:p-12">
        <CardSkeleton />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (!provider) return null;

  const selectedServiceObj = provider.services?.find((s: any) => s.id === selectedService);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 min-h-[85vh]">
      {/* Back Button */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-gray-400 hover:text-white mb-6 text-sm transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to search
      </button>

      {/* Profile Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-8 md:p-10 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/5 rounded-full blur-3xl -z-10 translate-x-1/4 -translate-y-1/4" />

        <div className="flex items-start gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shrink-0">
            {(provider.user?.name || 'P').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h1 className="text-3xl font-bold text-white">{provider.user?.name || provider.businessName}</h1>
              {provider.isVerified && (
                <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/30">
                  <ShieldCheck className="w-3 h-3" /> Verified
                </span>
              )}
            </div>
            {provider.businessName && <p className="text-blue-400 text-sm mb-2">{provider.businessName}</p>}
            <p className="text-gray-400 mb-4">{provider.description || provider.experience || 'Professional Service Provider'}</p>

            <div className="flex flex-wrap items-center gap-4 text-sm">
              {provider.address && (
                <span className="flex items-center gap-1 text-gray-400">
                  <MapPin className="w-4 h-4 text-gray-500" /> {provider.address}
                </span>
              )}
              <span className="flex items-center gap-1 text-yellow-400">
                <Star className="w-4 h-4 fill-yellow-400" /> {provider.rating?.toFixed(1) || '0.0'}
                <span className="text-gray-500">({provider.reviewCount || 0} reviews)</span>
              </span>
              {provider.category && <Badge status={provider.category} />}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Services */}
      <h2 className="text-2xl font-semibold mb-5 text-white">Select a Service</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        {(provider.services || []).map((service: any) => (
          <motion.div
            whileHover={{ scale: 1.01 }}
            key={service.id}
            className={`cursor-pointer glass-card p-6 transition-all ${
              selectedService === service.id ? 'ring-2 ring-blue-500 bg-blue-500/5' : 'hover:bg-white/[0.06]'
            }`}
            onClick={() => { setSelectedService(service.id); setSelectedSlot(null); }}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-medium text-white">{service.name}</h3>
                <p className="text-sm text-gray-500">{service.description || service.category}</p>
              </div>
              <Badge status={service.category} />
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1 text-blue-400 font-bold">
                <DollarSign className="w-4 h-4" /> ₹{service.baseFee}
                {service.tax > 0 && <span className="text-gray-500 font-normal">+ ₹{service.tax} tax</span>}
              </span>
              <span className="flex items-center gap-1 text-gray-400">
                <Clock className="w-4 h-4" /> {service.duration || 30} min
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Date & Slot Picker */}
      {selectedService && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="glass-panel p-8 mb-10">
          <h2 className="text-2xl font-semibold mb-5 text-white">Choose Date & Time</h2>

          {/* Date Picker */}
          <div className="mb-6">
            <label className="text-sm text-gray-400 mb-2 block">Select Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => { setSelectedDate(e.target.value); setSelectedSlot(null); }}
              min={new Date().toISOString().split('T')[0]}
              className="px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full max-w-xs"
            />
          </div>

          {/* Time Slots Grid */}
          {selectedDate && (
            <div>
              <label className="text-sm text-gray-400 mb-3 block">Available Slots</label>
              {slotsLoading ? (
                <div className="flex items-center gap-2 text-gray-500"><Loader2 className="w-4 h-4 animate-spin" /> Loading slots...</div>
              ) : slots.length === 0 ? (
                <p className="text-gray-500 text-sm">No available slots for this date. Try another date.</p>
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                  {slots.map(slot => (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedSlot(slot.id)}
                      className={`px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                        selectedSlot === slot.id
                          ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                          : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Booking Summary & Button */}
          {selectedSlot && selectedServiceObj && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 pt-6 border-t border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-400">Total Amount</p>
                  <p className="text-2xl font-bold text-white">₹{(selectedServiceObj.baseFee + (selectedServiceObj.tax || 0)).toFixed(2)}</p>
                </div>
                <Button size="lg" className="px-10 bg-gradient-to-r from-blue-600 to-purple-600" onClick={handleBook} disabled={booking}>
                  {booking ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <><Calendar className="w-5 h-5 mr-2" /> Book Now</>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Reviews Section */}
      <div className="mb-10">
        <h2 className="text-2xl font-semibold mb-5 text-white">Reviews</h2>
        {reviews.length === 0 ? (
          <div className="glass-card p-8 text-center text-gray-500">
            <Star className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No reviews yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review: any) => (
              <motion.div key={review.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                    {(review.customer?.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{review.customer?.name || 'Anonymous'}</p>
                    <p className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
                    ))}
                  </div>
                </div>
                {review.comment && <p className="text-sm text-gray-300">{review.comment}</p>}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
