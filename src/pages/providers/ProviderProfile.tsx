import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { CardSkeleton } from '../../components/ui/skeleton';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/toast';
import api from '../../lib/api';
import {
  Star, MapPin, Clock, DollarSign, Calendar, ChevronLeft, ChevronRight,
  ShieldCheck, Loader2, Check, MessageSquare, Info
} from 'lucide-react';
import SEO from '../../components/SEO';

// ─── Calendar Helpers ─────────────────────────────────────
function getDaysInMonth(year: number, month: number) { return new Date(year, month + 1, 0).getDate(); }
function getFirstDayOfWeek(year: number, month: number) { return new Date(year, month, 1).getDay(); }
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toDateStr(d: Date) { return d.toISOString().split('T')[0]; }

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
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [promoError, setPromoError] = useState('');
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [messaging, setMessaging] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);

  // Calendar state
  const today = new Date();
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());

  // Fetch provider
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/providers/${id}`);
        setProvider(res.data.provider);
        setReviews(res.data.provider.reviews || []);
      } catch { showToast('Provider not found', 'error'); navigate('/search'); }
      finally { setLoading(false); }
    })();
  }, [id]);

  // Fetch reviews
  useEffect(() => {
    if (!id) return;
    api.get(`/reviews/provider/${id}`).then(r => setReviews(r.data.reviews || [])).catch(() => {});
  }, [id]);

  // Fetch available dates for current calendar month
  useEffect(() => {
    if (!id) return;
    // Fetch all slots for this month to highlight available days
    const startDate = toDateStr(new Date(calYear, calMonth, 1));
    const endDate = toDateStr(new Date(calYear, calMonth + 1, 0));
    api.get(`/providers/${id}/slots`, { params: { date: startDate, endDate } })
      .then(res => {
        const dates = new Set<string>();
        const now = Date.now();
        (res.data.slots || []).forEach((s: any) => {
          const slotTime = new Date(s.startTime).getTime();
          if (s.isAvailable && slotTime > now) dates.add(toDateStr(new Date(s.startTime)));
        });
        setAvailableDates(dates);
      })
      .catch(() => setAvailableDates(new Set()));
  }, [id, calMonth, calYear]);

  // Fetch slots for selected date
  useEffect(() => {
    if (!selectedDate || !id) return;
    setSlotsLoading(true);
    api.get(`/providers/${id}/slots`, { params: { date: selectedDate } })
      .then(res => {
        const now = Date.now();
        const validSlots = (res.data.slots || []).filter((s: any) => s.isAvailable && new Date(s.startTime).getTime() > now);
        setSlots(validSlots);
      })
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [selectedDate, id]);

  const handleBook = async () => {
    if (!isAuthenticated) { showToast('Please sign in to book', 'info'); navigate('/login'); return; }
    if (!selectedService || !selectedSlot) { showToast('Please select a service and time slot', 'error'); return; }
    setBooking(true);
    try {
      const res = await api.post('/appointments', {
        providerId: id, serviceId: selectedService, timeSlotId: selectedSlot,
        addOnIds: selectedAddOns.length > 0 ? selectedAddOns : undefined,
        promoCode: appliedPromo ? appliedPromo.code : undefined,
      });
      showToast('Appointment booked! Proceed to payment.', 'success');
      navigate(`/checkout/${res.data.appointment.id}`);
    } catch (err: any) { showToast(err.response?.data?.error || 'Booking failed', 'error'); }
    finally { setBooking(false); }
  };

  const handleMessage = async () => {
    if (!isAuthenticated) { showToast('Please sign in to message', 'info'); navigate('/login'); return; }
    if (!provider?.userId) { showToast('Cannot message this provider', 'error'); return; }
    setMessaging(true);
    try {
      const res = await api.post('/messages/conversations', { participantId: provider.userId });
      navigate(`/dashboard/messages?active=${res.data.conversation.id}`);
    } catch (err: any) { showToast(err.response?.data?.error || 'Could not start conversation', 'error'); }
    finally { setMessaging(false); }
  };

  if (loading) return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8"><CardSkeleton /><div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8"><CardSkeleton /><CardSkeleton /></div></div>
    </div>
  );
  if (!provider) return null;

  const selectedServiceObj = provider.services?.find((s: any) => s.id === selectedService);

  const calculateTotals = () => {
    if (!selectedServiceObj) return { base: 0, subtotal: 0, discount: 0, total: 0 };
    let base = selectedServiceObj.baseFee + (selectedServiceObj.tax || 0);
    let subtotal = base;
    if (selectedAddOns.length > 0 && selectedServiceObj.addOns) {
      selectedAddOns.forEach(aid => { const a = selectedServiceObj.addOns.find((x: any) => x.id === aid); if (a) subtotal += a.price; });
    }
    let discount = 0;
    if (appliedPromo) {
      if (appliedPromo.discountType === 'FLAT') {
        discount = Math.min(appliedPromo.discountValue, subtotal);
      } else {
        discount = (subtotal * appliedPromo.discountValue) / 100;
      }
    }
    return { base, subtotal, discount, total: subtotal - discount };
  };

  const handleApplyPromo = () => {
    setPromoError('');
    if (!promoCodeInput.trim()) return;
    const promo = provider.promoCodes?.find((p: any) => p.code.toUpperCase() === promoCodeInput.trim().toUpperCase());
    if (!promo) { setPromoError('Invalid promo code'); setAppliedPromo(null); return; }
    const valid = (!promo.validUntil || new Date(promo.validUntil) > new Date()) && (!promo.maxUses || promo.currentUses < promo.maxUses);
    if (!valid) { setPromoError('Promo expired or limit reached'); setAppliedPromo(null); return; }
    setAppliedPromo(promo); setPromoError('');
    showToast(`Promo applied! ${promo.discountType === 'FLAT' ? '₹' + promo.discountValue : promo.discountValue + '% off'}`, 'success');
  };

  const handleCalDateClick = (day: number) => {
    const d = new Date(calYear, calMonth, day);
    if (d < new Date(today.getFullYear(), today.getMonth(), today.getDate())) return; // past
    setSelectedDate(toDateStr(d));
    setSelectedSlot(null);
  };

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
    else setCalMonth(calMonth - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
    else setCalMonth(calMonth + 1);
  };

  const totals = calculateTotals();
  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfWeek(calYear, calMonth);
  const todayStr = toDateStr(today);

  return (
    <>
      <SEO 
        title={provider.businessName || provider.user.name} 
        description={`Book professional ${provider.category || 'services'} with ${provider.businessName || provider.user.name}. Browse available time slots and book instantly on Bookit.`} 
        keywords={`${provider.businessName || provider.user.name}, ${provider.category || 'services'}, bookit, ${provider.services?.map((s:any)=>s.name).join(', ')}`}
      />
      <div className="pt-16 min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Back */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-gray-400 hover:text-gray-700 mb-4 text-sm transition-colors" aria-label="Go back">
          <ChevronLeft className="w-4 h-4" /> Back to search
        </button>

        {/* ═══════════ Profile Header ═══════════ */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-7 mb-5">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
              {(provider.user?.name || 'P').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">{provider.user?.name || provider.businessName}</h1>
                {provider.isVerified && (
                  <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                    <ShieldCheck className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
              {provider.businessName && <p className="text-sm text-blue-600">{provider.businessName}</p>}
              <p className="text-sm text-gray-500 mt-1">{provider.description || 'Professional Service Provider'}</p>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
                {provider.address && <span className="flex items-center gap-1 text-gray-400 text-xs"><MapPin className="w-3.5 h-3.5" /> {provider.address}</span>}
                <span className="flex items-center gap-1 text-yellow-600 text-xs"><Star className="w-3.5 h-3.5 fill-yellow-500" /> {provider.rating?.toFixed(1) || '0.0'} <span className="text-gray-400">({provider.reviewCount || 0})</span></span>
                {provider.category && <Badge status={provider.category} />}
              </div>
              <div className="mt-3">
                <Button variant="outline" size="sm" onClick={handleMessage} loading={messaging} disabled={!provider.userId}>
                  <MessageSquare className="w-4 h-4" /> Message Provider
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════ Services ═══════════ */}
        <h2 className="font-semibold text-gray-900 text-base sm:text-lg mb-3">Select a Service</h2>
        {(!provider.services || provider.services.length === 0) ? (
          <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-gray-400 mb-5">
            <Info className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>This provider hasn't added any services yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            {provider.services.map((service: any) => (
              <div
                key={service.id}
                className={`cursor-pointer bg-white border rounded-xl p-4 sm:p-5 transition-all ${selectedService === service.id ? 'ring-2 ring-blue-600 border-blue-300 bg-blue-50/30' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}`}
                onClick={() => { setSelectedService(service.id); setSelectedSlot(null); setSelectedAddOns([]); setAppliedPromo(null); setPromoCodeInput(''); }}
                tabIndex={0} role="button" aria-pressed={selectedService === service.id}
                onKeyDown={e => e.key === 'Enter' && (setSelectedService(service.id), setSelectedSlot(null))}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{service.name}</h3>
                    <p className="text-xs text-gray-400 line-clamp-2">{service.description || service.category}</p>
                  </div>
                  <Badge status={service.category} />
                </div>
                <div className="flex items-center gap-4 text-xs sm:text-sm">
                  <span className="flex items-center gap-1 text-blue-600 font-bold">
                    <DollarSign className="w-3.5 h-3.5" />₹{service.baseFee}
                    {service.tax > 0 && <span className="text-gray-400 font-normal">+₹{service.tax} tax</span>}
                  </span>
                  <span className="flex items-center gap-1 text-gray-400"><Clock className="w-3.5 h-3.5" />{service.duration || 30} min</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══════════ Calendar + Booking ═══════════ */}
        {selectedService && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 mb-5">
            {/* Add-ons */}
            {selectedServiceObj?.addOns?.length > 0 && (
              <div className="mb-5 pb-5 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900 text-sm mb-3">Enhance your service (Optional)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedServiceObj.addOns.map((addon: any) => {
                    const sel = selectedAddOns.includes(addon.id);
                    return (
                      <div
                        key={addon.id}
                        onClick={() => setSelectedAddOns(p => sel ? p.filter(x => x !== addon.id) : [...p, addon.id])}
                        className={`cursor-pointer flex items-center justify-between p-3 rounded-xl border transition-all text-sm ${sel ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}
                        tabIndex={0} role="checkbox" aria-checked={sel}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-4 h-4 rounded flex items-center justify-center border ${sel ? 'bg-green-600 border-green-600' : 'border-gray-300'}`}>
                            {sel && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <div>
                            <p className={`font-medium text-xs ${sel ? 'text-green-700' : 'text-gray-700'}`}>{addon.name}</p>
                            {addon.duration > 0 && <p className="text-[10px] text-gray-400">+{addon.duration} min</p>}
                          </div>
                        </div>
                        <p className="font-bold text-gray-900 text-xs">+₹{addon.price}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Calendar Grid ── */}
            <h3 className="font-semibold text-gray-900 text-sm mb-3">Choose Date & Time</h3>
            <div className="max-w-sm mx-auto sm:mx-0 mb-5">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-3">
                <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Previous month">
                  <ChevronLeft className="w-4 h-4 text-gray-500" />
                </button>
                <p className="text-sm font-semibold text-gray-900">{MONTH_NAMES[calMonth]} {calYear}</p>
                <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Next month">
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {DAY_LABELS.map(d => (
                  <div key={d} className="text-center text-[10px] font-semibold text-gray-400 uppercase py-1">{d}</div>
                ))}
              </div>
              {/* Day Cells */}
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = toDateStr(new Date(calYear, calMonth, day));
                  const isPast = new Date(calYear, calMonth, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                  const isToday = dateStr === todayStr;
                  const isAvailable = availableDates.has(dateStr);
                  const isSelected = dateStr === selectedDate;

                  return (
                    <button
                      key={day}
                      onClick={() => handleCalDateClick(day)}
                      disabled={isPast}
                      className={`aspect-square rounded-lg text-xs font-medium transition-all flex items-center justify-center relative ${
                        isPast ? 'text-gray-300 cursor-not-allowed' :
                        isSelected ? 'bg-blue-600 text-white shadow-sm' :
                        isToday ? 'bg-blue-50 text-blue-700 font-bold' :
                        isAvailable ? 'bg-green-50 text-gray-900 hover:bg-green-100 ring-1 ring-green-200' :
                        'text-gray-600 hover:bg-gray-100'
                      }`}
                      aria-label={`${day} ${MONTH_NAMES[calMonth]} ${calYear}`}
                    >
                      {day}
                      {isAvailable && !isSelected && (
                        <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-green-500" />
                      )}
                    </button>
                  );
                })}
              </div>
              {/* Legend */}
              <div className="flex items-center gap-4 mt-3 text-[10px] text-gray-400">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Available</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-600" /> Selected</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-50 border border-blue-200" style={{width:8,height:8}} /> Today</span>
              </div>
            </div>

            {/* ── Time Slots ── */}
            {selectedDate && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Slots for {new Date(selectedDate + 'T00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </label>
                {slotsLoading ? (
                  <div className="flex items-center gap-2 text-gray-400 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div>
                ) : slots.length === 0 ? (
                  <p className="text-sm text-gray-400">No available slots for this date. Try another day.</p>
                ) : (
                  <div className="flex overflow-x-auto gap-4 pb-6 pt-2 snap-x hide-scrollbar">
                    {slots.filter(s => s.isAvailable).map(slot => {
                      const timeStr = new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      const endTimeStr = new Date(slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                      return (
                        <button
                          key={slot.id}
                          onClick={() => setSelectedSlot(slot.id)}
                          className={`relative flex-none w-[130px] snap-center rounded-[14px] transition-all duration-300 focus:outline-none ${
                            selectedSlot === slot.id
                              ? 'scale-105 shadow-xl shadow-blue-500/20 z-10'
                              : 'hover:scale-105 hover:shadow-md hover:z-10'
                          }`}
                        >
                          <div className={`flex flex-col border-2 overflow-hidden rounded-[14px] ${
                            selectedSlot === slot.id
                              ? 'border-blue-600 bg-gradient-to-b from-blue-600 to-blue-700 text-white'
                              : 'border-gray-200 bg-white text-gray-900 border-dashed hover:border-blue-400'
                          }`}>
                            <div className={`p-4 text-center border-b-[2px] border-dashed ${selectedSlot === slot.id ? 'border-white/30' : 'border-gray-200'}`}>
                              <span className="text-xl font-bold tracking-tight block mb-0.5">{timeStr}</span>
                              <span className={`text-[10px] font-bold tracking-widest uppercase ${selectedSlot === slot.id ? 'text-blue-100' : 'text-gray-400'}`}>
                                To {endTimeStr}
                              </span>
                            </div>
                            <div className={`py-2 text-center ${selectedSlot === slot.id ? 'bg-black/10' : 'bg-gray-50/50'}`}>
                              <span className={`text-[11px] font-bold uppercase tracking-wider ${selectedSlot === slot.id ? 'text-white' : 'text-blue-600'}`}>
                                {selectedSlot === slot.id ? 'Selected' : 'Select'}
                              </span>
                            </div>
                          </div>

                          {/* Ticket Edge Cutouts */}
                          <div className="absolute top-[60%] -left-2 w-4 h-4 rounded-full -translate-y-1/2 bg-gray-50 shadow-inner" style={{ clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)' }} />
                          <div className="absolute top-[60%] -right-2 w-4 h-4 rounded-full -translate-y-1/2 bg-gray-50 shadow-inner" style={{ clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)' }} />
                          
                          {slot.title && (
                            <span className={`absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-bold px-2 py-0.5 rounded-full border ${selectedSlot === slot.id ? 'bg-white text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-600 border-gray-200'} whitespace-nowrap shadow-sm`}>
                              {slot.title}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── Booking Summary ── */}
            {selectedSlot && selectedServiceObj && (
              <div className="mt-5 pt-5 border-t border-gray-100">
                {/* Promo */}
                <div className="mb-4 bg-gray-50 p-3 sm:p-4 rounded-lg max-w-sm">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Promo Code</label>
                  <div className="flex gap-2">
                    <input type="text" value={promoCodeInput} onChange={e => setPromoCodeInput(e.target.value.toUpperCase())} placeholder="ENTER CODE" className="flex-1 px-3 py-2 rounded-lg border border-gray-300 bg-white text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none uppercase" />
                    <Button variant="outline" size="sm" onClick={handleApplyPromo}>Apply</Button>
                  </div>
                  {promoError && <p className="text-red-600 text-[10px] mt-1">{promoError}</p>}
                  {appliedPromo && <p className="text-green-600 text-[10px] mt-1 flex items-center gap-1"><Check className="w-3 h-3" /> -{appliedPromo.discountType === 'FLAT' ? `₹${appliedPromo.discountValue}` : `${appliedPromo.discountValue}%`} off</p>}
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Total</p>
                    <div className="flex items-end gap-2">
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">₹{totals.total.toFixed(2)}</p>
                      {appliedPromo && <p className="text-sm text-gray-400 line-through mb-0.5">₹{totals.subtotal.toFixed(2)}</p>}
                    </div>
                    {appliedPromo && <p className="text-green-600 text-xs font-medium">Saved ₹{totals.discount.toFixed(2)}!</p>}
                  </div>
                  <Button variant="primary" size="lg" className="w-full sm:w-auto px-6" onClick={handleBook} loading={booking}>
                    <Calendar className="w-4 h-4" /> Book & Pay
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════ Reviews ═══════════ */}
        <h2 className="font-semibold text-gray-900 text-base sm:text-lg mb-3">Reviews</h2>
        {reviews.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 text-center">
            <Star className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-gray-400 text-sm">No reviews yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((review: any) => (
              <div key={review.id} className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                    {(review.customer?.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{review.customer?.name || 'Anonymous'}</p>
                    <p className="text-[10px] text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                    ))}
                  </div>
                </div>
                {review.comment && <p className="text-sm text-gray-600">{review.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </>
  );
}
