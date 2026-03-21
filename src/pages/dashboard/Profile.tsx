import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/toast';
import api from '../../lib/api';
import { User, Phone, MapPin, Save, Camera } from 'lucide-react';

const CATEGORIES = ['Healthcare', 'Beauty & Wellness', 'Home Services', 'Education', 'Fitness', 'Legal', 'Finance', 'Other'];

export default function Profile() {
  const { user, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', contactNo: '', location: '' });
  const [providerForm, setProviderForm] = useState({ businessName: '', description: '', category: '', address: '' });

  useEffect(() => {
    if (user) {
      setForm({ name: user.name || '', contactNo: user.contactNo || '', location: user.location || '' });
    }
    if (user?.role === 'PROVIDER') {
      api.get('/auth/profile').then(res => {
        const pp = res.data.user?.providerProfile;
        if (pp) setProviderForm({ businessName: pp.businessName || '', description: pp.description || '', category: pp.category || '', address: pp.address || '' });
      }).catch(() => {});
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/auth/profile', form);
      if (user?.role === 'PROVIDER') await api.put('/providers/profile', providerForm);
      await refreshProfile();
      showToast('Profile saved successfully', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));
  const setProvider = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setProviderForm(p => ({ ...p, [k]: e.target.value }));

  const initials = (user?.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">My Profile</h1>
        <p className="text-sm text-gray-500 mb-6">Manage your personal information</p>

        {/* Avatar Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-5 flex items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold">
              {user?.avatar ? <img src={user.avatar} alt={user.name} className="w-20 h-20 rounded-full object-cover" /> : initials}
            </div>
            <button className="absolute bottom-0 right-0 w-7 h-7 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors" aria-label="Change photo">
              <Camera className="w-3.5 h-3.5 text-gray-600" />
            </button>
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-lg">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <span className="mt-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
              {user?.role}
            </span>
          </div>
        </div>

        {/* Personal Info */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-5">
          <h2 className="font-semibold text-gray-900 mb-4">Personal Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Full name" value={form.name} onChange={set('name')} placeholder="Your name" icon={<User className="w-4 h-4" />} />
            <Input label="Phone number" value={form.contactNo} onChange={set('contactNo')} placeholder="+91 98765 43210" icon={<Phone className="w-4 h-4" />} />
            <div className="sm:col-span-2">
              <Input label="Location" value={form.location} onChange={set('location')} placeholder="City, State" icon={<MapPin className="w-4 h-4" />} />
            </div>
          </div>
        </div>

        {/* Provider-specific Info */}
        {user?.role === 'PROVIDER' && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-5">
            <h2 className="font-semibold text-gray-900 mb-4">Business Information</h2>
            <div className="space-y-4">
              <Input label="Business name" value={providerForm.businessName} onChange={setProvider('businessName')} placeholder="Sharma Dental Clinic" />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={providerForm.category}
                  onChange={setProvider('category')}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business description</label>
                <textarea
                  value={providerForm.description}
                  onChange={setProvider('description')}
                  rows={3}
                  placeholder="Tell customers about your services..."
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <Input label="Business address" value={providerForm.address} onChange={setProvider('address')} placeholder="Street, City, State" icon={<MapPin className="w-4 h-4" />} />
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button variant="primary" loading={saving} onClick={handleSave}>
            <Save className="w-4 h-4" /> Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
