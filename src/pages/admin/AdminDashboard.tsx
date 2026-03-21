import { useState, useEffect } from 'react';
import {
  Users, Building2, Calendar, DollarSign, ShieldCheck, ShieldOff,
  Loader2, TrendingUp, AlertTriangle, Search
} from 'lucide-react';
import { useToast } from '../../components/ui/toast';
import { Badge } from '../../components/ui/badge';
import { StatsSkeleton, ListSkeleton } from '../../components/ui/skeleton';
import api from '../../lib/api';

type Tab = 'overview' | 'users' | 'providers' | 'appointments';

function StatCard({ label, value, icon: Icon, color }: any) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const { showToast } = useToast();
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    api.get('/admin/stats')
      .then(r => setStats(r.data.stats))
      .catch(() => showToast('Failed to load stats', 'error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab === 'users' && users.length === 0) api.get('/admin/users').then(r => setUsers(r.data.users)).catch(() => {});
    if (tab === 'providers' && providers.length === 0) api.get('/admin/providers').then(r => setProviders(r.data.providers)).catch(() => {});
    if (tab === 'appointments' && appointments.length === 0) api.get('/admin/appointments').then(r => setAppointments(r.data.appointments)).catch(() => {});
  }, [tab]);

  const verifyProvider = async (id: string, verified: boolean) => {
    try {
      await api.patch(`/admin/providers/${id}/verify`, { isVerified: verified });
      setProviders(p => p.map(x => x.id === id ? { ...x, isVerified: verified } : x));
      showToast(`Provider ${verified ? 'verified' : 'unverified'}`, 'success');
    } catch { showToast('Action failed', 'error'); }
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'users', label: 'Users' },
    { id: 'providers', label: 'Providers' },
    { id: 'appointments', label: 'Appointments' },
  ];

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-sm text-gray-500">Full platform visibility and management</p>
          </div>
        </div>

        {/* Tab Nav */}
        <div className="flex gap-1 p-1 bg-white border border-gray-200 rounded-xl mb-6 w-fit">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.id ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === 'overview' && (
          loading ? <StatsSkeleton /> : stats ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard label="Total Users" value={stats.totalUsers} icon={Users} color="bg-blue-600" />
                <StatCard label="Providers" value={stats.totalProviders} icon={Building2} color="bg-purple-600" />
                <StatCard label="Appointments" value={stats.totalAppointments} icon={Calendar} color="bg-emerald-600" />
                <StatCard label="Revenue" value={`₹${(stats.platformRevenue || 0).toFixed(0)}`} icon={DollarSign} color="bg-amber-600" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Total Revenue (All Providers)</p>
                  <p className="text-2xl font-bold text-emerald-600">₹{(stats.totalRevenue || 0).toLocaleString()}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Platform Cut (10%)</p>
                  <p className="text-2xl font-bold text-amber-600">₹{(stats.platformRevenue || 0).toLocaleString()}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Avg. Bookings/Provider</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.totalProviders > 0 ? (stats.totalAppointments / stats.totalProviders).toFixed(1) : '0'}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
              <AlertTriangle className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
              <p className="text-gray-500">Could not load statistics.</p>
            </div>
          )
        )}

        {/* Search bar (for Users, Providers, Appointments) */}
        {tab !== 'overview' && (
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 mb-4 w-72">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={`Search ${tab}...`}
              className="flex-1 text-sm text-gray-900 outline-none placeholder:text-gray-400 bg-transparent"
            />
          </div>
        )}

        {/* Users */}
        {tab === 'users' && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Name', 'Email', 'Joined', 'Verified'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.filter(u => u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase())).map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-900">{u.name}</td>
                    <td className="px-5 py-3 text-gray-500">{u.email}</td>
                    <td className="px-5 py-3 text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${u.isVerified ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {u.isVerified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && <div className="p-8 text-center text-gray-400"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />Loading...</div>}
          </div>
        )}

        {/* Providers */}
        {tab === 'providers' && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Business', 'Category', 'Rating', 'Services', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {providers.filter(p => p.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) || p.user?.name?.toLowerCase().includes(searchQuery.toLowerCase())).map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{p.businessName || p.user?.name}</p>
                      <p className="text-xs text-gray-400">{p.user?.email}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-500">{p.category || '—'}</td>
                    <td className="px-5 py-3 text-amber-600 font-medium">⭐ {p.rating?.toFixed(1) || '—'}</td>
                    <td className="px-5 py-3 text-gray-500">{p._count?.services || 0}</td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => verifyProvider(p.id, !p.isVerified)}
                        className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                          p.isVerified
                            ? 'border-red-300 text-red-700 hover:bg-red-50'
                            : 'border-green-300 text-green-700 hover:bg-green-50'
                        }`}
                      >
                        {p.isVerified ? <><ShieldOff className="w-3 h-3" /> Unverify</> : <><ShieldCheck className="w-3 h-3" /> Verify</>}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {providers.length === 0 && <div className="p-8 text-center text-gray-400"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />Loading...</div>}
          </div>
        )}

        {/* Appointments */}
        {tab === 'appointments' && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Customer', 'Provider', 'Service', 'Status', 'Amount', 'Date'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {appointments.filter(a => a.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || a.service?.name?.toLowerCase().includes(searchQuery.toLowerCase())).map(a => (
                  <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-900">{a.customer?.name}</td>
                    <td className="px-5 py-3 text-gray-500">{a.provider?.user?.name}</td>
                    <td className="px-5 py-3 text-gray-700">{a.service?.name}</td>
                    <td className="px-5 py-3"><Badge status={a.status} /></td>
                    <td className="px-5 py-3 font-semibold text-gray-900">₹{a.totalAmount || a.amount}</td>
                    <td className="px-5 py-3 text-gray-400">{new Date(a.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {appointments.length === 0 && <div className="p-8 text-center text-gray-400"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />Loading...</div>}
          </div>
        )}
      </div>
    </div>
  );
}
