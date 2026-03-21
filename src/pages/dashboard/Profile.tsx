import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/toast';
import api from '../../lib/api';
import { User, Mail, Phone, MapPin, Building2, Save, Loader2 } from 'lucide-react';

export default function Profile() {
  const { user, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', contactNo: '', location: '' });
  const [providerForm, setProviderForm] = useState({ businessName: '', description: '', category: '', address: '', experience: '' });

  useEffect(() => {
    if (user) {
      setForm({ name: user.name || '', contactNo: user.contactNo || '', location: user.location || '' });
    }
    // Load provider profile if applicable
    if (user?.role === 'PROVIDER') {
      api.get('/auth/profile').then(res => {
        const pp = res.data.user?.providerProfile;
        if (pp) {
          setProviderForm({
            businessName: pp.businessName || '',
            description: pp.description || '',
            category: pp.category || '',
            address: pp.address || '',
            experience: pp.experience || '',
          });
        }
      }).catch(() => {});
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await api.put('/auth/profile', form);
      if (user?.role === 'PROVIDER') {
        await api.put('/providers/profile', providerForm);
      }
      await refreshProfile();
      showToast('Profile updated!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 min-h-[85vh]">
      <h1 className="text-3xl font-bold text-white mb-2">My Profile</h1>
      <p className="text-gray-400 mb-8">Manage your personal information</p>

      {/* Avatar + Info Header */}
      <div className="relative overflow-hidden bg-zinc-950 border border-white/10 rounded-2xl p-6 mb-8 shadow-2xl flex items-center gap-5">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 pointer-events-none"></div>
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shrink-0">
          {(user?.name || 'U').charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">{user?.name}</h2>
          <p className="text-sm text-gray-400">{user?.email}</p>
          <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">{user?.role}</span>
        </div>
      </div>

      {/* Basic Info */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative overflow-hidden bg-zinc-950 border border-white/10 rounded-2xl p-6 mb-6 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 pointer-events-none"></div>
        <h3 className="text-lg font-semibold text-white mb-4">Personal Information</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="pl-10" />
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input value={user?.email || ''} disabled className="pl-10 opacity-50" />
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input value={form.contactNo} onChange={e => setForm({ ...form, contactNo: e.target.value })} className="pl-10" placeholder="+91 98765 43210" />
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="pl-10" placeholder="City, State" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Provider Business Info */}
      {user?.role === 'PROVIDER' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="relative overflow-hidden bg-zinc-950 border border-white/10 rounded-2xl p-6 mb-6 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 pointer-events-none"></div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-purple-400" /> Business Profile
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">Business Name</label>
              <Input value={providerForm.businessName} onChange={e => setProviderForm({ ...providerForm, businessName: e.target.value })} placeholder="Your Business Name" />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">Category</label>
              <Input value={providerForm.category} onChange={e => setProviderForm({ ...providerForm, category: e.target.value })} placeholder="e.g., Doctor, Salon, Fitness" />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">Description</label>
              <textarea
                value={providerForm.description}
                onChange={e => setProviderForm({ ...providerForm, description: e.target.value })}
                rows={3}
                placeholder="Tell customers about your business..."
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">Experience</label>
              <Input value={providerForm.experience} onChange={e => setProviderForm({ ...providerForm, experience: e.target.value })} placeholder="e.g., 10+ years" />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">Business Address</label>
              <Input value={providerForm.address} onChange={e => setProviderForm({ ...providerForm, address: e.target.value })} placeholder="Full business address" />
            </div>
          </div>
        </motion.div>
      )}

      {/* Save */}
      <Button onClick={handleSaveProfile} disabled={saving} className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600">
        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5 mr-2" /> Save Changes</>}
      </Button>
    </div>
  );
}
