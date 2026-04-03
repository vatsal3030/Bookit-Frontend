import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import Modal from '../../components/ui/modal';
import { useToast } from '../../components/ui/toast';
import api from '../../lib/api';
import { Plus, Edit3, Trash2, Loader2, DollarSign, Clock, Briefcase } from 'lucide-react';

export default function ManageServices() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', category: '', duration: 30, baseFee: 0, tax: 0 });
  
  // Addon Modal State
  const [addonModalOpen, setAddonModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [addonForm, setAddonForm] = useState({ name: '', description: '', price: 0, duration: 15 });
  const [savingAddon, setSavingAddon] = useState(false);

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

  const resetForm = () => { setForm({ name: '', description: '', category: '', duration: 30, baseFee: 0, tax: 0 }); setEditing(null); };
  const openAdd = () => { resetForm(); setModalOpen(true); };
  const openEdit = (s: any) => {
    setEditing(s);
    setForm({ name: s.name, description: s.description || '', category: s.category, duration: s.duration || 30, baseFee: s.baseFee, tax: s.tax || 0 });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.category || form.baseFee <= 0) { showToast('Please fill all required fields', 'error'); return; }
    setSaving(true);
    try {
      if (editing) { await api.put(`/providers/services/${editing.id}`, form); showToast('Service updated!', 'success'); }
      else { await api.post('/providers/services', form); showToast('Service added!', 'success'); }
      setModalOpen(false); resetForm(); fetchServices();
    } catch (err: any) { showToast(err.response?.data?.error || 'Failed to save', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try { await api.delete(`/providers/services/${id}`); showToast('Service deactivated', 'success'); fetchServices(); }
    catch (err: any) { showToast(err.response?.data?.error || 'Failed to remove', 'error'); }
  };

  const openAddons = (s: any) => {
    setSelectedService(s);
    setAddonForm({ name: '', description: '', price: 0, duration: 15 });
    setAddonModalOpen(true);
  };

  const handleSaveAddon = async () => {
    if (!addonForm.name || addonForm.price < 0) { showToast('Please enter a valid name and price', 'error'); return; }
    setSavingAddon(true);
    try {
      await api.post(`/providers/services/${selectedService.id}/addons`, addonForm);
      showToast('Add-on created!', 'success');
      setAddonForm({ name: '', description: '', price: 0, duration: 15 });
      // Fetch services will refresh everything, including nestled add-ons
      await fetchServices();
      // Also update selected local service to show the new AddOn immediately:
      const updatedSvc = (await api.get('/auth/profile')).data.user?.providerProfile?.services.find((sx: any) => sx.id === selectedService.id);
      setSelectedService(updatedSvc);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to save add-on', 'error');
    } finally {
      setSavingAddon(false);
    }
  };

  const handleDeleteAddon = async (addonId: string) => {
    try {
      await api.delete(`/providers/addons/${addonId}`);
      showToast('Add-on deleted', 'success');
      await fetchServices();
      const updatedSvc = (await api.get('/auth/profile')).data.user?.providerProfile?.services.find((sx: any) => sx.id === selectedService.id);
      setSelectedService(updatedSvc);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to delete add-on', 'error');
    }
  };

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Services</h1>
            <p className="text-sm text-gray-500 mt-0.5">Add and manage your service offerings</p>
          </div>
          <Button variant="primary" onClick={openAdd}><Plus className="w-4 h-4" /> Add Service</Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
        ) : services.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <Briefcase className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <h3 className="font-semibold text-gray-700 mb-1">No services yet</h3>
            <p className="text-sm text-gray-400 mb-5">Add your first service to start receiving bookings.</p>
            <Button variant="primary" onClick={openAdd}><Plus className="w-4 h-4" /> Add Service</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map(s => (
              <div key={s.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-all group">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{s.name}</h3>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{s.category}</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(s)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"><Edit3 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(s.id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                {s.description && <p className="text-sm text-gray-500 mb-3">{s.description}</p>}
                <div className="flex items-center gap-4 text-sm mb-4">
                  <span className="flex items-center gap-1 text-blue-600 font-bold"><DollarSign className="w-4 h-4" />₹{s.baseFee}</span>
                  <span className="flex items-center gap-1 text-gray-400"><Clock className="w-4 h-4" />{s.duration} min</span>
                  {s.tax > 0 && <span className="text-gray-400">+₹{s.tax} tax</span>}
                </div>
                
                <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium">Add-ons: {s.addOns?.length || 0}</span>
                  <Button variant="outline" size="sm" onClick={() => openAddons(s)}>
                    Manage Add-ons
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); resetForm(); }} title={editing ? 'Edit Service' : 'Add New Service'}>
          <div className="space-y-4">
            <Input label="Service Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., General Consultation" />
            <Input label="Category *" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g., Doctor, Salon" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Brief description" className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Input label="Price (₹) *" value={form.baseFee === 0 ? '' : form.baseFee} onChange={e => { const val = e.target.value.replace(/[^0-9]/g, ''); setForm({ ...form, baseFee: val === '' ? 0 : Number(val) }) }} placeholder="0" />
              <Input label="Tax (₹)" value={form.tax === 0 ? '' : form.tax} onChange={e => { const val = e.target.value.replace(/[^0-9]/g, ''); setForm({ ...form, tax: val === '' ? 0 : Number(val) }) }} placeholder="0" />
              <Input label="Duration (min)" value={form.duration === 0 ? '' : form.duration} onChange={e => { const val = e.target.value.replace(/[^0-9]/g, ''); setForm({ ...form, duration: val === '' ? 0 : Number(val) }) }} placeholder="30" />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="ghost" onClick={() => { setModalOpen(false); resetForm(); }}>Cancel</Button>
              <Button variant="primary" loading={saving} onClick={handleSave}>{editing ? 'Update' : 'Add Service'}</Button>
            </div>
          </div>
        </Modal>

        {/* Add-ons Modal */}
        <Modal 
          isOpen={addonModalOpen} 
          onClose={() => setAddonModalOpen(false)} 
          title={`Manage Add-ons: ${selectedService?.name}`}
        >
          <div className="space-y-6">
            {/* List Existing Addons */}
            {selectedService?.addOns?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900 border-b pb-1">Current Add-ons</h4>
                {selectedService.addOns.map((addon: any) => (
                  <div key={addon.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{addon.name}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <span className="text-emerald-600 font-semibold">+₹{addon.price}</span>
                        <span>•</span>
                        <span>+{addon.duration} min</span>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteAddon(addon.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-white rounded-md transition-colors shadow-sm border border-transparent hover:border-red-100">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Create New Addon */}
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 space-y-4">
              <h4 className="text-sm font-semibold text-blue-900">Create New Add-on</h4>
              <Input label="Name *" value={addonForm.name} onChange={e => setAddonForm({ ...addonForm, name: e.target.value })} placeholder="e.g. Extra deep cleaning" />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Extra Price (₹) *" value={addonForm.price === 0 ? '' : addonForm.price} onChange={e => { const val = e.target.value.replace(/[^0-9]/g, ''); setAddonForm({ ...addonForm, price: val === '' ? 0 : Number(val) }) }} placeholder="0" />
                <Input label="Extra Time (min)" value={addonForm.duration === 0 ? '' : addonForm.duration} onChange={e => { const val = e.target.value.replace(/[^0-9]/g, ''); setAddonForm({ ...addonForm, duration: val === '' ? 0 : Number(val) }) }} placeholder="15" />
              </div>
              <div className="flex justify-end pt-2">
                <Button variant="primary" loading={savingAddon} onClick={handleSaveAddon} className="w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-1" /> Add Option
                </Button>
              </div>
            </div>
            
            <div className="flex justify-end pt-2 border-t border-gray-100">
              <Button variant="ghost" onClick={() => setAddonModalOpen(false)}>Done</Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
