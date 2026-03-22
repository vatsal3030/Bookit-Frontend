import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import Modal from '../../components/ui/modal';
import { useToast } from '../../components/ui/toast';
import api from '../../lib/api';
import { Plus, Edit3, Trash2, Loader2, Users } from 'lucide-react';

export default function ManageStaff() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', role: '', email: '', phone: '' });

  const { showToast } = useToast();

  const fetchStaff = async () => {
    try {
      const res = await api.get('/auth/profile');
      setStaff(res.data.user?.providerProfile?.teamMembers || []);
    } catch {
      showToast('Failed to load staff members', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStaff(); }, []);

  const resetForm = () => { setForm({ name: '', role: '', email: '', phone: '' }); setEditing(null); };
  const openAdd = () => { resetForm(); setModalOpen(true); };
  const openEdit = (s: any) => {
    setEditing(s);
    setForm({ name: s.name, role: s.role || '', email: s.email || '', phone: s.phone || '' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name) { showToast('Name is required', 'error'); return; }
    setSaving(true);
    try {
      if (editing) { await api.put(`/providers/staff/${editing.id}`, form); showToast('Staff updated!', 'success'); }
      else { await api.post('/providers/staff', form); showToast('Staff added!', 'success'); }
      setModalOpen(false); resetForm(); fetchStaff();
    } catch (err: any) { showToast(err.response?.data?.error || 'Failed to save', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if(!window.confirm('Are you sure you want to remove this staff member?')) return;
    try { await api.delete(`/providers/staff/${id}`); showToast('Staff removed', 'success'); fetchStaff(); }
    catch (err: any) { showToast(err.response?.data?.error || 'Failed to remove', 'error'); }
  };

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Staff</h1>
            <p className="text-gray-500 mt-1">Add team members to allow parallel bookings.</p>
          </div>
          <Button onClick={openAdd} variant="primary">
            <Plus className="w-4 h-4 mr-2" /> Add Staff
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
        ) : staff.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No staff members yet</h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">Add staff members to your organization to allow multiple appointments at the same time.</p>
            <Button onClick={openAdd}><Plus className="w-4 h-4 mr-2" /> Add First Member</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {staff.map((s) => (
              <div key={s.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:border-blue-200 transition-colors group">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{s.name}</h3>
                    <p className="text-sm text-blue-600 font-medium">{s.role || 'Staff Member'}</p>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(s)} className="p-1.5 text-gray-400 hover:text-blue-600 bg-white hover:bg-blue-50 rounded-md transition-colors shadow-sm border border-gray-100"><Edit3 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(s.id)} className="p-1.5 text-gray-400 hover:text-red-600 bg-white hover:bg-red-50 rounded-md transition-colors shadow-sm border border-gray-100"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="space-y-1.5 text-sm">
                  {s.email && <div className="flex items-center text-gray-600"><span className="w-16 text-gray-400">Email:</span> {s.email}</div>}
                  {s.phone && <div className="flex items-center text-gray-600"><span className="w-16 text-gray-400">Phone:</span> {s.phone}</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Staff Member' : 'Add New Staff Member'}>
          <div className="space-y-4">
            <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="E.g. Dr. John Smith" />
            <Input label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="E.g. Senior Therapist" />
            <Input label="Email (Optional)" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@example.com" />
            <Input label="Phone (Optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1234567890" />
            
            <div className="pt-4 flex justify-end gap-3 z-50 relative">
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} loading={saving}>Save Staff</Button>
            </div>
          </div>
        </Modal>

      </div>
    </div>
  );
}
