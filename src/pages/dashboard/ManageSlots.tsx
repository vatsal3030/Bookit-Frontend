import { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, Plus, Trash2, ChevronLeft, ChevronRight, Loader2, Info, Tag, AlignLeft } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import Modal from '../../components/ui/modal';
import { useToast } from '../../components/ui/toast';
import api from '../../lib/api';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function getDaysInMonth(year: number, month: number) { return new Date(year, month + 1, 0).getDate(); }
function getFirstDayOfWeek(year: number, month: number) { return new Date(year, month, 1).getDay(); }
function toDateStr(d: Date) { return d.toISOString().split('T')[0]; }

export default function ManageSlots() {
  const { showToast } = useToast();
  const [provider, setProvider] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Calendar state
  const today = new Date();
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(toDateStr(today));

  // Add slot modal
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ startTime: '09:00', endTime: '10:00', title: '', description: '', serviceId: '', staffId: '', autoDivide: false, durationMin: 30 });

  const [providerId, setProviderId] = useState<string | null>(null);

  // Fetch provider profile & services securely
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/auth/profile');
        const prof = res.data.user?.providerProfile;
        if (prof) {
          setProviderId(prof.id);
          setServices(prof.services || []);
          setStaffList(prof.teamMembers || []);
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  // Fetch slots for selected date
  const fetchSlots = useCallback(async () => {
    if (!selectedDate || !providerId) return;
    setLoading(true);
    try {
      const res = await api.get(`/providers/${providerId}/slots`, { params: { date: selectedDate } });
      setSlots(res.data.slots || []);
    } catch { setSlots([]); }
    finally { setLoading(false); }
  }, [selectedDate, providerId]);

  useEffect(() => { fetchSlots(); }, [fetchSlots]);

  const handleAddSlot = async () => {
    if (!form.startTime || !form.endTime) { showToast('Start and end times are required', 'error'); return; }
    setCreating(true);
    try {
      const start = new Date(`${selectedDate}T${form.startTime}`);
      const end = new Date(`${selectedDate}T${form.endTime}`);

      if (form.autoDivide && form.durationMin > 0) {
        let current = start.getTime();
        const durationMs = form.durationMin * 60 * 1000;
        const slotsToCreate = [];
        
        while (current + durationMs <= end.getTime()) {
           const slotEnd = current + durationMs;
           slotsToCreate.push({
             startTime: new Date(current).toISOString(),
             endTime: new Date(slotEnd).toISOString(),
             title: form.title || undefined,
             description: form.description || undefined,
           });
           current = slotEnd;
        }
        
        if (slotsToCreate.length === 0) {
           showToast('Block too small for duration', 'error');
           setCreating(false);
           return;
        }
        
        await api.post('/providers/slots/bulk', {
          date: selectedDate,
          serviceId: form.serviceId || undefined,
          staffId: form.staffId || undefined,
          slots: slotsToCreate,
        });
        showToast(`Created ${slotsToCreate.length} slots!`, 'success');
      } else {
        await api.post('/providers/slots', {
          date: selectedDate,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          title: form.title || undefined,
          description: form.description || undefined,
          serviceId: form.serviceId || undefined,
          staffId: form.staffId || undefined,
        });
        showToast('Slot added!', 'success');
      }

      setShowModal(false);
      setForm({ startTime: '09:00', endTime: '10:00', title: '', description: '', serviceId: '', staffId: '', autoDivide: false, durationMin: 30 });
      fetchSlots();
    } catch (err: any) { showToast(err.response?.data?.error || 'Failed to add slot', 'error'); }
    finally { setCreating(false); }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await api.delete(`/providers/slots/${id}`);
      showToast('Slot deleted', 'success');
      fetchSlots();
    } catch (err: any) { showToast(err.response?.data?.error || 'Failed to delete', 'error'); }
    finally { setDeleting(null); }
  };

  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfWeek(calYear, calMonth);
  const todayStr = toDateStr(today);

  const prevMonth = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); } else setCalMonth(calMonth - 1); };
  const nextMonth = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); } else setCalMonth(calMonth + 1); };

  const handleCalDateClick = (day: number) => {
    const d = new Date(calYear, calMonth, day);
    setSelectedDate(toDateStr(d));
  };

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Availability</h1>
            <p className="text-sm text-gray-500 mt-0.5">Add, view, or remove your time slots</p>
          </div>
          <Button variant="primary" onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4" /> Add Slot
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Previous month">
                  <ChevronLeft className="w-4 h-4 text-gray-500" />
                </button>
                <p className="text-sm font-semibold text-gray-900">{MONTH_NAMES[calMonth]} {calYear}</p>
                <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Next month">
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-1">
                {DAY_LABELS.map(d => (
                  <div key={d} className="text-center text-[10px] font-semibold text-gray-400 uppercase py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = toDateStr(new Date(calYear, calMonth, day));
                  const isToday = dateStr === todayStr;
                  const isSelected = dateStr === selectedDate;

                  return (
                    <button
                      key={day}
                      onClick={() => handleCalDateClick(day)}
                      className={`aspect-square rounded-lg text-xs font-medium transition-all flex items-center justify-center ${
                        isSelected ? 'bg-blue-600 text-white shadow-sm' :
                        isToday ? 'bg-blue-50 text-blue-700 font-bold' :
                        'text-gray-600 hover:bg-gray-100'
                      }`}
                      aria-label={`${day} ${MONTH_NAMES[calMonth]} ${calYear}`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Slots for selected date */}
          <div className="lg:col-span-3">
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900">
                  Slots for {new Date(selectedDate + 'T00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </h2>
                <Button variant="outline" size="sm" onClick={() => setShowModal(true)}>
                  <Plus className="w-3.5 h-3.5" /> Add
                </Button>
              </div>

              {loading ? (
                <div className="flex items-center gap-2 text-gray-400 text-sm py-8 justify-center"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div>
              ) : slots.length === 0 ? (
                <div className="text-center py-10">
                  <Calendar className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-gray-400">No slots for this date.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {slots.map(slot => (
                    <div key={slot.id} className={`flex items-start justify-between gap-3 p-3 rounded-xl border transition-colors ${slot.isAvailable ? 'border-green-200 bg-green-50/30' : 'border-amber-200 bg-amber-50/30'}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${slot.isAvailable ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {slot.isAvailable ? 'Available' : 'Booked'}
                          </span>
                        </div>
                        {slot.title && <p className="text-xs font-medium text-gray-700 flex items-center gap-1"><Tag className="w-3 h-3 text-gray-400" /> {slot.title}</p>}
                        {slot.description && <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><AlignLeft className="w-3 h-3" /> {slot.description}</p>}
                        {slot.service && <p className="text-[10px] text-blue-600 mt-0.5">Service: {slot.service.name}</p>}
                        {slot.staff && <p className="text-[10px] text-purple-600 mt-0.5 font-medium">Assigned: {slot.staff.name}</p>}
                      </div>
                      {slot.isAvailable && (
                        <button
                          onClick={() => handleDelete(slot.id)}
                          disabled={deleting === slot.id}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors flex-shrink-0"
                          aria-label="Delete slot"
                        >
                          {deleting === slot.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Slot Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={`Add Slot for ${new Date(selectedDate + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="time"
                value={form.startTime}
                onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input
                type="time"
                value={form.endTime}
                onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <input type="checkbox" id="autoDivide" checked={form.autoDivide} onChange={e => setForm(f => ({ ...f, autoDivide: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <label htmlFor="autoDivide" className="text-sm text-gray-700 font-medium">Auto-divide block into multiple slots</label>
          </div>
          {form.autoDivide && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration per slot (minutes)</label>
              <input type="number" min="5" value={form.durationMin} onChange={e => setForm(f => ({ ...f, durationMin: parseInt(e.target.value) || 30 }))} className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          )}
          <Input
            label="Title (optional)"
            placeholder="e.g. Morning Consultation"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Any additional details about this slot"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          {services.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Link to Service (optional)</label>
              <select
                value={form.serviceId}
                onChange={e => setForm(f => ({ ...f, serviceId: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— General availability —</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.name} (₹{s.baseFee})</option>
                ))}
              </select>
            </div>
          )}
          {staffList.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Staff Member (optional)</label>
              <select
                value={form.staffId}
                onChange={e => setForm(f => ({ ...f, staffId: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— Unassigned (Provider) —</option>
                {staffList.map(s => (
                  <option key={s.id} value={s.id}>{s.name} {s.role ? `(${s.role})` : ''}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="flex gap-2 justify-end mt-6">
          <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" loading={creating} onClick={handleAddSlot}>Add Slot</Button>
        </div>
      </Modal>
    </div>
  );
}
