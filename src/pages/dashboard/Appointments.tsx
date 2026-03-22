import { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, Star, Search, RefreshCw, ChevronLeft, ChevronRight, XCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { ListSkeleton } from '../../components/ui/skeleton';
import Modal from '../../components/ui/modal';
import { Input } from '../../components/ui/input';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/toast';
import api from '../../lib/api';
import CustomerAnalytics from './CustomerAnalytics';

const STATUS_TABS = ['All', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED', 'NO_SHOW'] as const;

export default function Appointments() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [view, setView] = useState<'appointments' | 'analytics'>('appointments');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  // Cancel modal
  const [cancelModal, setCancelModal] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Reschedule modal
  const [rescheduleModal, setRescheduleModal] = useState<any>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlots, setRescheduleSlots] = useState<any[]>([]);
  const [selectedNewSlot, setSelectedNewSlot] = useState<string | null>(null);
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [rescheduling, setRescheduling] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Review modal
  const [reviewModal, setReviewModal] = useState<any>(null);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 15 };
      if (activeFilter !== 'All') params.status = activeFilter;
      const res = await api.get('/appointments', { params });
      setAppointments(res.data.appointments || []);
      setPagination(res.data.pagination || null);
    } catch {
      showToast('Failed to load appointments', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, activeFilter]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  // Keyboard: Escape closes modals
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setCancelModal(null); setReviewModal(null); setRescheduleModal(null); }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, []);

  // Fetch available slots when reschedule date changes
  useEffect(() => {
    if (!rescheduleDate || !rescheduleModal) return;
    setSlotsLoading(true);
    api.get(`/providers/${rescheduleModal.providerId}/slots`, { params: { date: rescheduleDate } })
      .then(res => setRescheduleSlots((res.data.slots || []).filter((s: any) => s.isAvailable)))
      .catch(() => setRescheduleSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [rescheduleDate, rescheduleModal]);

  const handleCancel = async () => {
    if (!cancelModal || !cancelReason.trim()) { showToast('Please provide a cancellation reason', 'error'); return; }
    setCancelling(true);
    try {
      const res = await api.patch(`/appointments/${cancelModal}/cancel`, { reason: cancelReason });
      const refund = res.data.refundAmount;
      showToast(`Appointment cancelled${refund > 0 ? `. Refund: ₹${refund.toFixed(2)}` : ''}`, 'success');
      setCancelModal(null);
      setCancelReason('');
      fetchAppointments();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to cancel', 'error');
    } finally {
      setCancelling(false);
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleModal || !selectedNewSlot) { showToast('Please pick a new time slot', 'error'); return; }
    setRescheduling(true);
    try {
      await api.patch(`/appointments/${rescheduleModal.id}/reschedule`, { newTimeSlotId: selectedNewSlot, reason: rescheduleReason });
      showToast('Appointment rescheduled!', 'success');
      setRescheduleModal(null);
      setRescheduleDate('');
      setRescheduleSlots([]);
      setSelectedNewSlot(null);
      setRescheduleReason('');
      fetchAppointments();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Reschedule failed', 'error');
    } finally {
      setRescheduling(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewModal) return;
    setSubmittingReview(true);
    try {
      await api.post('/reviews', { appointmentId: reviewModal.id, rating: reviewData.rating, comment: reviewData.comment });
      showToast('Review submitted! Thank you.', 'success');
      setReviewModal(null);
      setReviewData({ rating: 5, comment: '' });
      fetchAppointments();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to submit review', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleMarkCompleted = async (id: string) => {
    try {
      await api.patch(`/appointments/${id}/complete`);
      showToast('Appointment marked as completed!', 'success');
      fetchAppointments();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to mark completed', 'error');
    }
  };

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
            <p className="text-sm text-gray-500 mt-0.5">{pagination?.total || appointments.length} total</p>
          </div>
          <div className="flex gap-2">
            {user?.role === 'CUSTOMER' && (
              <div className="flex gap-1 p-1 bg-white border border-gray-200 rounded-lg">
                <button
                  onClick={() => setView('appointments')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${view === 'appointments' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  Appointments
                </button>
                <button
                  onClick={() => setView('analytics')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${view === 'analytics' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  My Analytics
                </button>
              </div>
            )}
            {user?.role === 'PROVIDER' && (
              <Button variant="outline" onClick={() => navigate('/dashboard/provider')}>Provider Dashboard</Button>
            )}
            <Button variant="primary" onClick={() => navigate('/search')}>+ New Booking</Button>
          </div>
        </div>

        {view === 'analytics' ? (
          <CustomerAnalytics />
        ) : (
          <>
            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
              {STATUS_TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => { setActiveFilter(tab); setPage(1); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-colors border ${
                    activeFilter === tab
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {tab === 'All' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase().replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* List */}
            {loading ? (
              <ListSkeleton rows={4} />
            ) : appointments.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                <Calendar className="w-14 h-14 mx-auto mb-3 text-gray-300" />
                <h3 className="font-semibold text-gray-700 mb-1">No appointments found</h3>
                <p className="text-sm text-gray-400 mb-5">
                  {activeFilter === 'All' ? "You haven't booked any appointments yet." : `No ${activeFilter.toLowerCase()} appointments.`}
                </p>
                <Button variant="primary" onClick={() => navigate('/search')}>
                  <Search className="w-4 h-4" /> Find Services
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.map(appt => {
                  const isPast = appt.timeSlot?.startTime ? new Date(appt.timeSlot.startTime) < new Date() : false;
                  
                  return (
                  <div
                    key={appt.id}
                    className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 hover:shadow-sm transition-all"
                    tabIndex={0}
                    role="article"
                    aria-label={`Appointment: ${appt.service?.name}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{appt.service?.name || 'Service'}</h3>
                          <Badge status={appt.status} />
                          {appt.confirmationNo && (
                            <span className="text-[10px] text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded">#{appt.confirmationNo}</span>
                          )}
                          {isPast && ['PENDING', 'CONFIRMED'].includes(appt.status) && (
                            <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider">Overdue</span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-500 mb-2">
                          {user?.role === 'CUSTOMER'
                            ? `With ${appt.provider?.user?.name || 'Provider'}`
                            : `Customer: ${appt.customer?.name || 'Unknown'}`}
                        </p>
                        <div className="flex flex-wrap gap-3 text-xs sm:text-sm text-gray-500">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            {new Date(appt.timeSlot?.date || appt.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            {new Date(appt.timeSlot?.startTime || appt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="font-semibold text-gray-900">₹{appt.totalAmount || appt.amount}</span>
                          {appt.payment?.status && (
                            <Badge status={appt.payment.status === 'SUCCESS' ? 'Paid' : appt.payment.status === 'REFUNDED' ? 'Refunded' : 'Unpaid'} />
                          )}
                        </div>
                        {appt.cancellationReason && (
                          <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><XCircle className="w-3 h-3" /> {appt.cancellationReason}</p>
                        )}
                        {appt.rescheduleReason && (
                          <p className="text-xs text-blue-500 mt-1 flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Rescheduled: {appt.rescheduleReason}</p>
                        )}
                      </div>
                      <div className="flex gap-2 flex-shrink-0 flex-wrap">
                        {appt.status === 'PENDING' && !appt.payment && (
                          <Button variant="primary" size="sm" onClick={() => navigate(`/checkout/${appt.id}`)}>Pay Now</Button>
                        )}
                        {appt.status === 'COMPLETED' && !appt.review && user?.role === 'CUSTOMER' && (
                          <Button variant="outline" size="sm" onClick={() => setReviewModal(appt)}>
                            <Star className="w-3.5 h-3.5" /> Review
                          </Button>
                        )}
                        {['PENDING', 'CONFIRMED'].includes(appt.status) && appt.rescheduleAllowed !== false && !isPast && (
                          <Button variant="outline" size="sm" onClick={() => setRescheduleModal(appt)}>
                            <RefreshCw className="w-3.5 h-3.5" /> Reschedule
                          </Button>
                        )}
                        {['PENDING', 'CONFIRMED'].includes(appt.status) && !isPast && (
                          <Button variant="danger" size="sm" onClick={() => setCancelModal(appt.id)}>Cancel</Button>
                        )}
                        {['PENDING', 'CONFIRMED'].includes(appt.status) && isPast && user?.role === 'PROVIDER' && (
                          <Button variant="primary" size="sm" onClick={() => handleMarkCompleted(appt.id)}>Complete</Button>
                        )}
                        {['PENDING', 'CONFIRMED'].includes(appt.status) && isPast && user?.role === 'CUSTOMER' && (
                          <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 shadow-sm flex items-center">
                            Awaiting Provider
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                 )})}

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 pt-4">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage(p => p - 1)}
                      className="p-2 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-gray-600 font-medium">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <button
                      disabled={page >= pagination.totalPages}
                      onClick={() => setPage(p => p + 1)}
                      className="p-2 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      aria-label="Next page"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Cancel Modal */}
      <Modal isOpen={!!cancelModal} onClose={() => setCancelModal(null)} title="Cancel Appointment">
        <p className="text-sm text-gray-500 mb-2">This action cannot be undone.</p>
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
          Cancellations more than 24h before your slot receive a full refund. Later cancellations incur a 50% charge.
        </p>
        <Input
          label="Reason (required)"
          placeholder="Let us know why you're cancelling"
          value={cancelReason}
          onChange={e => setCancelReason(e.target.value)}
          className="mb-5"
        />
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => setCancelModal(null)}>Keep Appointment</Button>
          <Button variant="danger" loading={cancelling} onClick={handleCancel} disabled={!cancelReason.trim()}>Confirm Cancel</Button>
        </div>
      </Modal>

      {/* Reschedule Modal */}
      <Modal isOpen={!!rescheduleModal} onClose={() => { setRescheduleModal(null); setRescheduleDate(''); setRescheduleSlots([]); setSelectedNewSlot(null); setRescheduleReason(''); }} title="Reschedule Appointment">
        <p className="text-sm text-gray-500 mb-4">Pick a new date and time slot to reschedule your appointment.</p>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">New Date</label>
          <input
            type="date"
            value={rescheduleDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={e => { setRescheduleDate(e.target.value); setSelectedNewSlot(null); }}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {rescheduleDate && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Available Slots</label>
            {slotsLoading ? (
              <p className="text-sm text-gray-400">Loading slots...</p>
            ) : rescheduleSlots.length === 0 ? (
              <p className="text-sm text-gray-400">No available slots for this date.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {rescheduleSlots.map(slot => (
                  <button
                    key={slot.id}
                    onClick={() => setSelectedNewSlot(slot.id)}
                    className={`px-2 py-2 rounded-lg text-xs font-medium border transition-colors ${
                      selectedNewSlot === slot.id
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <Input
          label="Reason (optional)"
          placeholder="Why are you rescheduling?"
          value={rescheduleReason}
          onChange={e => setRescheduleReason(e.target.value)}
          className="mb-5"
        />
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => setRescheduleModal(null)}>Cancel</Button>
          <Button variant="primary" loading={rescheduling} onClick={handleReschedule} disabled={!selectedNewSlot}>Confirm Reschedule</Button>
        </div>
      </Modal>

      {/* Review Modal */}
      <Modal isOpen={!!reviewModal} onClose={() => setReviewModal(null)} title="Leave a Review">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => setReviewData(p => ({ ...p, rating: n }))}
                aria-label={`${n} stars`}
                className="focus-visible:outline-none"
              >
                <Star className={`w-8 h-8 transition-colors ${n <= reviewData.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
              </button>
            ))}
          </div>
        </div>
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">Comment (optional)</label>
          <textarea
            rows={3}
            value={reviewData.comment}
            onChange={e => setReviewData(p => ({ ...p, comment: e.target.value }))}
            placeholder="How was your experience?"
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => setReviewModal(null)}>Cancel</Button>
          <Button variant="success" loading={submittingReview} onClick={handleSubmitReview}>Submit Review</Button>
        </div>
      </Modal>
    </div>
  );
}
