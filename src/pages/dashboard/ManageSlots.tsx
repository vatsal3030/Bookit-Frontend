import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useToast } from '../../components/ui/toast';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import { Plus, Trash2, Loader2, Clock, Calendar } from 'lucide-react';

export default function ManageSlots() {
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [providerId, setProviderId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('09:30');
  const { showToast } = useToast();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await api.get('/auth/profile');
        const pid = res.data.user?.providerProfile?.id;
        if (pid) {
          setProviderId(pid);
          // Load today's slots
          const today = new Date().toISOString().split('T')[0];
          setDate(today);
          const slotsRes = await api.get(`/providers/${pid}/slots`, { params: { date: today } });
          setSlots(slotsRes.data.slots || []);
        }
      } catch {
        showToast('Failed to load slots', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const fetchSlots = async (d: string) => {
    if (!providerId) return;
    try {
      const res = await api.get(`/providers/${providerId}/slots`, { params: { date: d } });
      setSlots(res.data.slots || []);
    } catch {}
  };

  const handleDateChange = (d: string) => {
    setDate(d);
    fetchSlots(d);
  };

  const handleAddSlot = async () => {
    if (!date || !startTime || !endTime) {
      showToast('Please fill all fields', 'error');
      return;
    }
    setSaving(true);
    try {
      const slotDate = new Date(date);
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      const start = new Date(slotDate);
      start.setHours(sh, sm, 0, 0);
      const end = new Date(slotDate);
      end.setHours(eh, em, 0, 0);

      await api.post('/providers/slots', {
        date: slotDate.toISOString(),
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      });
      showToast('Slot added!', 'success');
      fetchSlots(date);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to add slot', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkAdd = async () => {
    if (!date) {
      showToast('Please select a date first', 'error');
      return;
    }
    setSaving(true);
    try {
      const slotDate = new Date(date);
      const hourSlots = [];
      for (let h = 9; h <= 17; h++) {
        const start = new Date(slotDate);
        start.setHours(h, 0, 0, 0);
        const end = new Date(slotDate);
        end.setHours(h, 30, 0, 0);
        hourSlots.push({ startTime: start.toISOString(), endTime: end.toISOString() });
      }
      await api.post('/providers/slots/bulk', { date: slotDate.toISOString(), slots: hourSlots });
      showToast('Bulk slots added (9 AM - 5:30 PM)!', 'success');
      fetchSlots(date);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to add slots', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/providers/slots/${id}`);
      showToast('Slot deleted', 'success');
      fetchSlots(date);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to delete slot', 'error');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 min-h-[85vh]">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Manage Time Slots</h1>
          <p className="text-gray-400 text-sm mt-1">Add and manage your available time slots</p>
        </div>
      </div>

      {/* Date Selector + Add Slot */}
      <div className="relative overflow-hidden bg-zinc-950 border border-white/10 rounded-2xl p-6 mb-8 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 pointer-events-none"></div>
        <h3 className="text-lg font-medium text-white mb-4">Add Time Slot</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => handleDateChange(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">Start Time</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">End Time</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAddSlot} disabled={saving} className="flex-1">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-1" /> Add</>}
            </Button>
            <Button variant="glass" onClick={handleBulkAdd} disabled={saving} className="flex-1">
              Bulk Add
            </Button>
          </div>
        </div>
      </div>

      {/* Slots Grid */}
      <div className="flex items-center gap-3 mb-5">
        <Calendar className="w-5 h-5 text-blue-400" />
        <h2 className="text-xl font-semibold text-white">
          Slots for {date ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Select a date'}
        </h2>
      </div>

      {loading ? (
        <div className="text-center py-10"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-500" /></div>
      ) : slots.length === 0 ? (
        <div className="bg-zinc-950 border border-white/10 rounded-2xl p-8 text-center text-gray-500 shadow-xl">
          <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No slots for this date. Add some above!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {slots.map(slot => (
            <motion.div key={slot.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className={`bg-zinc-950 border ${slot.isAvailable ? 'border-white/10 hover:border-white/30' : 'border-white/5 bg-zinc-950/50'} rounded-2xl p-4 text-center relative group shadow-lg transition-all ${slot.isAvailable ? '' : 'opacity-40'}`}
            >
              <p className="text-sm font-medium text-white">
                {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-xs text-gray-500">
                to {new Date(slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              <span className={`text-[10px] mt-1 inline-block px-2 py-0.5 rounded-full ${slot.isAvailable ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                {slot.isAvailable ? 'Available' : 'Booked'}
              </span>
              {slot.isAvailable && (
                <button onClick={() => handleDelete(slot.id)}
                  className="absolute top-1 right-1 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-red-400 transition-all">
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
