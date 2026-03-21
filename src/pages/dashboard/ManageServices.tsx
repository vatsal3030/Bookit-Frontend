import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import Modal from '../../components/ui/modal';
import { useToast } from '../../components/ui/toast';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import { Plus, Edit3, Trash2, Loader2, DollarSign, Clock, Briefcase } from 'lucide-react';

export default function ManageServices() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', category: '', duration: 30, baseFee: 0, tax: 0 });
  const { showToast } = useToast();

  const fetchServices = async () => {
    try {
      const res = await api.get('/auth/profile');
      setServices(res.data.user?.providerProfile?.services || []);
    } catch {
      showToast('Failed to load services', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchServices(); }, []);

  const resetForm = () => {
    setForm({ name: '', description: '', category: '', duration: 30, baseFee: 0, tax: 0 });
    setEditing(null);
  };

  const openAdd = () => { resetForm(); setModalOpen(true); };
  const openEdit = (s: any) => {
    setEditing(s);
    setForm({ name: s.name, description: s.description || '', category: s.category, duration: s.duration || 30, baseFee: s.baseFee, tax: s.tax || 0 });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.category || form.baseFee <= 0) {
      showToast('Please fill all required fields', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/providers/services/${editing.id}`, form);
        showToast('Service updated!', 'success');
      } else {
        await api.post('/providers/services', form);
        showToast('Service added!', 'success');
      }
      setModalOpen(false);
      resetForm();
      fetchServices();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/providers/services/${id}`);
      showToast('Service deactivated', 'success');
      fetchServices();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to remove', 'error');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 min-h-[85vh]">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Manage Services</h1>
          <p className="text-gray-400 text-sm mt-1">Add and manage your service offerings</p>
        </div>
        <Button onClick={openAdd} className="bg-gradient-to-r from-blue-600 to-purple-600">
          <Plus className="w-4 h-4 mr-2" /> Add Service
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-20"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-500" /></div>
      ) : services.length === 0 ? (
        <div className="bg-zinc-950 border border-white/10 rounded-2xl p-12 text-center shadow-2xl">
          <Briefcase className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-400 mb-2">No services yet</h3>
          <p className="text-gray-500 mb-6">Add your first service to start receiving bookings.</p>
          <Button onClick={openAdd}><Plus className="w-4 h-4 mr-2" /> Add Service</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {services.map(s => (
              <motion.div key={s.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative overflow-hidden bg-zinc-950 border border-white/10 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all hover:border-white/20 group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.02] to-purple-500/[0.02] pointer-events-none"></div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{s.name}</h3>
                    <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{s.category}</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(s)} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition"><Edit3 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(s.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                {s.description && <p className="text-sm text-gray-400 mb-3">{s.description}</p>}
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-blue-400 font-bold"><DollarSign className="w-4 h-4" />₹{s.baseFee}</span>
                  <span className="flex items-center gap-1 text-gray-400"><Clock className="w-4 h-4" />{s.duration} min</span>
                  {s.tax > 0 && <span className="text-gray-500">+₹{s.tax} tax</span>}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); resetForm(); }} title={editing ? 'Edit Service' : 'Add New Service'}>
        <div className="space-y-4">
          <div><label className="text-sm text-gray-400 mb-1.5 block">Service Name *</label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., General Consultation" /></div>
          <div><label className="text-sm text-gray-400 mb-1.5 block">Category *</label><Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g., Doctor, Salon" /></div>
          <div><label className="text-sm text-gray-400 mb-1.5 block">Description</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Brief description" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-sm text-gray-400 mb-1.5 block">Price (₹) *</label><Input type="number" value={form.baseFee} onChange={e => setForm({ ...form, baseFee: Number(e.target.value) })} /></div>
            <div><label className="text-sm text-gray-400 mb-1.5 block">Tax (₹)</label><Input type="number" value={form.tax} onChange={e => setForm({ ...form, tax: Number(e.target.value) })} /></div>
            <div><label className="text-sm text-gray-400 mb-1.5 block">Duration</label><Input type="number" value={form.duration} onChange={e => setForm({ ...form, duration: Number(e.target.value) })} /></div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={() => { setModalOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editing ? 'Update' : 'Add'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
