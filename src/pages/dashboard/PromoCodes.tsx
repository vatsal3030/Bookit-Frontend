import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import Modal from '../../components/ui/modal';
import { useToast } from '../../components/ui/toast';
import api from '../../lib/api';
import { Plus, Trash2, Loader2, Tag, Percent, IndianRupee, Calendar } from 'lucide-react';

export default function PromoCodes() {
  const [promoCodes, setPromoCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('All');
  
  const [form, setForm] = useState({ 
    code: '', 
    discountType: 'PERCENTAGE', 
    discountValue: 10, 
    validUntil: '' 
  });
  
  const { showToast } = useToast();

  const fetchPromoCodes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/profile');
      setPromoCodes(res.data.user?.providerProfile?.promoCodes || []);
    } catch {
      showToast('Failed to load promo codes', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPromoCodes(); }, []);

  const resetForm = () => { 
    setForm({ code: '', discountType: 'PERCENTAGE', discountValue: 10, validUntil: '' }); 
    setModalOpen(false); 
  };

  const handleSave = async () => {
    if (!form.code || form.discountValue <= 0) { 
      showToast('Please provide a valid code and discount', 'error'); 
      return; 
    }
    if (form.discountType === 'PERCENTAGE' && form.discountValue > 100) {
      showToast('Percentage discount cannot exceed 100%', 'error');
      return;
    }
    setSaving(true);
    try {
      await api.post('/providers/promocodes', {
        ...form,
        // Send validUntil only if provided, else null
        validUntil: form.validUntil ? new Date(form.validUntil).toISOString() : undefined
      });
      showToast('Promo code created!', 'success');
      resetForm();
      fetchPromoCodes();
    } catch (err: any) { 
      showToast(err.response?.data?.error || 'Failed to create promo code', 'error'); 
    } finally { 
      setSaving(false); 
    }
  };

  const handleDelete = async (id: string) => {
    try { 
      await api.delete(`/providers/promocodes/${id}`); 
      showToast('Promo code deactivated', 'success'); 
      fetchPromoCodes(); 
    } catch (err: any) { 
      showToast(err.response?.data?.error || 'Failed to remove promo code', 'error'); 
    }
  };

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Promo Codes</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage discounts to attract more customers</p>
          </div>
          <Button variant="primary" onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> New Promo Code
          </Button>
        </div>

        {!loading && promoCodes.length > 0 && (
          <div className="flex gap-2 mb-6 border-b border-gray-200 pb-3">
            {['All', 'Active', 'Expired'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
                  activeFilter === tab
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
        ) : promoCodes.filter(p => {
          if (activeFilter === 'All') return true;
          const isExpired = p.validUntil ? new Date() > new Date(p.validUntil) : false;
          if (activeFilter === 'Active') return !isExpired;
          return isExpired;
        }).length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <Tag className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <h3 className="font-semibold text-gray-700 mb-1">
               {activeFilter !== 'All' ? `No ${activeFilter.toLowerCase()} promo codes.` : 'No promo codes yet'}
            </h3>
            <p className="text-sm text-gray-400 mb-5">Create your first promo code to offer deals.</p>
            <Button variant="primary" onClick={() => setModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1" /> Create Promo Code
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {promoCodes.filter(p => {
              if (activeFilter === 'All') return true;
              const isExpired = p.validUntil ? new Date() > new Date(p.validUntil) : false;
              if (activeFilter === 'Active') return !isExpired;
              return isExpired;
            }).map(p => {
              const isExpired = p.validUntil ? new Date() > new Date(p.validUntil) : false;
              return (
              <div key={p.id} className={`bg-white border rounded-xl p-5 hover:shadow-sm transition-all group relative ${isExpired ? 'border-gray-200 opacity-75 grayscale-[0.2]' : 'border-blue-100'}`}>
                <div className="absolute top-4 right-4 z-10">
                  <button onClick={() => handleDelete(p.id)} className="p-2 -mr-2 -mt-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex items-start justify-between mb-4">
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 font-bold tracking-widest uppercase rounded-lg border ${isExpired ? 'bg-gray-50 text-gray-500 border-gray-200' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                    <Tag className="w-3.5 h-3.5" />
                    {p.code}
                  </div>
                  {isExpired && <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100">Expired</span>}
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    {p.discountType === 'PERCENTAGE' ? <Percent className="w-4 h-4 text-gray-400" /> : <IndianRupee className="w-4 h-4 text-gray-400" />}
                    <span className="font-medium text-gray-900">
                      {p.discountType === 'PERCENTAGE' ? `${p.discountValue}% OFF` : `₹${p.discountValue} OFF`}
                    </span>
                  </div>
                  {p.validUntil && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className={isExpired ? 'text-red-500 font-medium' : ''}>
                        {isExpired ? 'Expired on: ' : 'Valid until: '} {new Date(p.validUntil).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )})}
          </div>
        )}

        {/* Create Promo Code Modal */}
        <Modal 
          isOpen={modalOpen} 
          onClose={resetForm} 
          title="Create Promo Code"
        >
          <div className="space-y-5">
            <Input 
              label="Promo Code *" 
              value={form.code} 
              onChange={e => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s/g, '') })} 
              placeholder="e.g. SUMMER20" 
            />
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type *</label>
                <select 
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.discountType}
                  onChange={e => setForm({ ...form, discountType: e.target.value })}
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FLAT">Flat Amount (₹)</option>
                </select>
              </div>
              <Input 
                label="Discount Amount *" 
                type="number" 
                value={form.discountValue} 
                onChange={e => setForm({ ...form, discountValue: Number(e.target.value) })} 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until (Optional)</label>
              <input 
                type="date"
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.validUntil}
                onChange={e => setForm({ ...form, validUntil: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">Leave blank if the code never expires.</p>
            </div>

            <div className="flex gap-2 justify-end pt-3 border-t border-gray-100">
              <Button variant="ghost" onClick={resetForm}>Cancel</Button>
              <Button variant="primary" loading={saving} onClick={handleSave}>Create Code</Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
