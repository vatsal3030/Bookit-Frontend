import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Star, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { ListSkeleton } from '../../components/ui/skeleton';
import Modal from '../../components/ui/modal';
import { Input } from '../../components/ui/input';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/toast';
import api from '../../lib/api';

const TABS = ['All', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];

export default function Appointments() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [cancelModal, setCancelModal] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [reviewModal, setReviewModal] = useState<any>(null);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await api.get('/appointments');
      setAppointments(res.data.appointments || res.data || []);
    } catch {
      showToast('Failed to load appointments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelModal) return;
    setCancelling(true);
    try {
      await api.patch(`/appointments/${cancelModal}/status`, { status: 'CANCELLED', reason: cancelReason });
      showToast('Appointment cancelled', 'success');
      setCancelModal(null);
      setCancelReason('');
      fetchAppointments();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to cancel', 'error');
    } finally {
      setCancelling(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewModal) return;
    setSubmittingReview(true);
    try {
      await api.post('/reviews', {
        appointmentId: reviewModal.id,
        rating: reviewData.rating,
        comment: reviewData.comment,
      });
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

  const filtered = activeTab === 'All' ? appointments : appointments.filter(a => a.status === activeTab);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 min-h-[85vh]">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">My Appointments</h1>
          <p className="text-gray-400 text-sm mt-1">{appointments.length} total appointments</p>
        </div>
        {user?.role === 'PROVIDER' && (
          <Button onClick={() => navigate('/dashboard/provider')} variant="glass">Provider Dashboard</Button>
        )}
      </div>

      {/* Tab Filters */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
            }`}
          >
            {tab === 'All' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
            {tab !== 'All' && (
              <span className="ml-1.5 text-xs opacity-60">
                ({appointments.filter(a => a.status === tab).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Appointment List */}
      {loading ? (
        <ListSkeleton rows={4} />
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-zinc-950 border border-white/10 rounded-2xl p-12 text-center shadow-2xl">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No appointments found</h3>
          <p className="text-gray-500 mb-6">
            {activeTab === 'All' ? "You haven't booked any appointments yet." : `No ${activeTab.toLowerCase()} appointments.`}
          </p>
          <Button onClick={() => navigate('/search')}>Find Services</Button>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filtered.map((appt, i) => (
              <motion.div
                key={appt.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: i * 0.05 }}
                className="relative overflow-hidden bg-zinc-950 border border-white/10 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all hover:border-white/20 group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.02] to-purple-500/[0.02] pointer-events-none"></div>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-lg font-semibold text-white">{appt.service?.name || 'Service'}</h3>
                      <Badge status={appt.status} />
                      {appt.confirmationNo && (
                        <span className="text-xs text-gray-500 font-mono">#{appt.confirmationNo}</span>
                      )}
                    </div>

                    <p className="text-sm text-gray-400 mb-3">
                      {user?.role === 'CUSTOMER'
                        ? `Provider: ${appt.provider?.user?.name || 'Unknown'}`
                        : `Customer: ${appt.customer?.name || 'Unknown'}`}
                    </p>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-300">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        {new Date(appt.timeSlot?.date || appt.createdAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-gray-500" />
                        {new Date(appt.timeSlot?.startTime || appt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="font-semibold text-blue-400">₹{appt.amount}</span>
                      {appt.payment && <Badge status={appt.payment.status} />}
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    {appt.status === 'PENDING' && !appt.payment && (
                      <Button onClick={() => navigate(`/checkout/${appt.id}`)} className="bg-gradient-to-r from-blue-600 to-purple-600">
                        Pay Now
                      </Button>
                    )}
                    {appt.status === 'COMPLETED' && !appt.review && user?.role === 'CUSTOMER' && (
                      <Button variant="glass" onClick={() => setReviewModal(appt)}>
                        <Star className="w-4 h-4 mr-1" /> Review
                      </Button>
                    )}
                    {['PENDING', 'CONFIRMED'].includes(appt.status) && (
                      <Button variant="outline" className="text-red-400 border-red-500/30 hover:bg-red-500/10"
                        onClick={() => setCancelModal(appt.id)}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Cancel Modal */}
      <Modal isOpen={!!cancelModal} onClose={() => setCancelModal(null)} title="Cancel Appointment">
        <p className="text-gray-400 text-sm mb-4">Are you sure you want to cancel this appointment?</p>
        <Input
          placeholder="Reason for cancellation (optional)"
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          className="mb-4"
        />
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={() => setCancelModal(null)}>Keep Appointment</Button>
          <Button onClick={handleCancel} disabled={cancelling} className="bg-red-600 hover:bg-red-700">
            {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Cancel'}
          </Button>
        </div>
      </Modal>

      {/* Review Modal */}
      <Modal isOpen={!!reviewModal} onClose={() => setReviewModal(null)} title="Leave a Review">
        <div className="mb-4">
          <label className="text-sm text-gray-400 mb-2 block">Rating</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => setReviewData(prev => ({ ...prev, rating: n }))}>
                <Star className={`w-8 h-8 transition-colors ${n <= reviewData.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
              </button>
            ))}
          </div>
        </div>
        <div className="mb-6">
          <label className="text-sm text-gray-400 mb-2 block">Comment (optional)</label>
          <textarea
            rows={3}
            value={reviewData.comment}
            onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
            placeholder="How was your experience?"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={() => setReviewModal(null)}>Cancel</Button>
          <Button onClick={handleSubmitReview} disabled={submittingReview}>
            {submittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Review'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
