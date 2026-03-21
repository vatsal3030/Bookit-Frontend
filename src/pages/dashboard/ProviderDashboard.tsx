import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { StatsSkeleton, ListSkeleton } from '../../components/ui/skeleton';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/toast';
import api from '../../lib/api';
import { Calendar, DollarSign, Star, Clock, Briefcase, Settings, TrendingUp, ArrowRight } from 'lucide-react';

function StatCard({ label, value, icon: Icon, color }: any) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

export default function ProviderDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [recentAppointments, setRecentAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [res, analyticsRes] = await Promise.all([
          api.get('/providers/dashboard/stats'),
          api.get('/providers/dashboard/analytics')
        ]);
        setStats(res.data.stats);
        setRecentAppointments(res.data.recentAppointments || []);
        setAnalytics(analyticsRes.data.analytics || []);
      } catch {
        showToast('Failed to load dashboard', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [showToast]);

  const maxRevenue = useMemo(() => {
    if (!analytics.length) return 0;
    return Math.max(...analytics.map(d => d.revenue));
  }, [analytics]);

  if (loading) {
    return (
      <div className="pt-16 min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          <StatsSkeleton />
          <ListSkeleton rows={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Provider Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">Welcome back, {user?.name}!</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/dashboard/services')}>
              <Briefcase className="w-4 h-4" /> Services
            </Button>
            <Button variant="primary" onClick={() => navigate('/dashboard/slots')}>
              <Settings className="w-4 h-4" /> Manage Slots
            </Button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Bookings" value={stats.totalAppointments} icon={Calendar} color="bg-blue-600" />
            <StatCard label="Revenue" value={`₹${stats.totalRevenue?.toLocaleString()}`} icon={DollarSign} color="bg-emerald-600" />
            <StatCard label="Upcoming" value={stats.upcomingAppointments} icon={Clock} color="bg-amber-600" />
            <StatCard label="Rating" value={stats.rating?.toFixed(1) || '0.0'} icon={Star} color="bg-purple-600" />
          </div>
        )}

        {/* Analytics Chart */}
        {analytics.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <h2 className="font-semibold text-gray-900">Revenue Analytics (30 Days)</h2>
            </div>
            <div className="h-48 flex items-end gap-1 overflow-x-auto pb-4">
              {analytics.map((day, i) => {
                const pct = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
                const dateObj = new Date(day.date);
                const isToday = i === analytics.length - 1;
                return (
                  <div key={day.date} className="flex flex-col items-center flex-1 min-w-[16px] group relative">
                    {/* Tooltip */}
                    <div className="absolute -top-14 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs py-1.5 px-2.5 rounded-lg pointer-events-none whitespace-nowrap z-10 shadow-lg">
                      <p className="font-semibold text-emerald-400">₹{day.revenue.toLocaleString()}</p>
                      <p className="text-gray-300">{dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                    </div>
                    <div
                      className={`w-full rounded-t transition-colors ${isToday ? 'bg-blue-600' : 'bg-blue-200 group-hover:bg-blue-400'}`}
                      style={{ height: `${Math.max(pct, 3)}%` }}
                    />
                    <span className="text-[9px] text-gray-400 mt-1">
                      {i % 7 === 0 || isToday ? dateObj.getDate() : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Appointments */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Appointments</h2>
            <button onClick={() => navigate('/dashboard/appointments')} className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentAppointments.length === 0 ? (
            <div className="text-center py-10">
              <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No appointments yet.</p>
              <p className="text-sm text-gray-400 mt-1">Share your profile to get bookings!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentAppointments.slice(0, 5).map((appt: any) => (
                <div key={appt.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-gray-200 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {(appt.customer?.name || 'C').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{appt.customer?.name}</p>
                      <p className="text-sm text-gray-500">{appt.service?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-sm text-gray-500">{new Date(appt.timeSlot?.date || appt.createdAt).toLocaleDateString()}</span>
                    <Badge status={appt.status} />
                    <span className="text-sm font-semibold text-gray-900">₹{appt.amount}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
