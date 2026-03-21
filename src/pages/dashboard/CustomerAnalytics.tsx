import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, DollarSign, CheckCircle, XCircle, Loader2, Calendar } from 'lucide-react';
import api from '../../lib/api';

const COLORS = ['#2563EB', '#7C3AED', '#DB2777', '#D97706', '#059669'];

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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md p-3 text-xs">
      <p className="text-gray-500 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">
          {p.name}: {p.name === 'spent' ? `₹${p.value.toFixed(0)}` : p.value}
        </p>
      ))}
    </div>
  );
};

export default function CustomerAnalytics() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/appointments/analytics/customer')
      .then(res => setAnalytics(res.data.analytics))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  if (!analytics) return <div className="bg-white border border-gray-200 rounded-xl p-10 text-center text-gray-400">Could not load analytics.</div>;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Bookings" value={analytics.totalAppointments} icon={Calendar} color="bg-blue-600" />
        <StatCard label="Total Spent" value={`₹${analytics.totalSpent.toFixed(0)}`} icon={DollarSign} color="bg-purple-600" />
        <StatCard label="Completed" value={analytics.completedCount} icon={CheckCircle} color="bg-green-600" />
        <StatCard label="Cancelled" value={analytics.cancelledCount} icon={XCircle} color="bg-red-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-white border border-gray-200 rounded-xl p-5 lg:col-span-2">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" /> Booking Activity (Last 30 Days)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analytics.dailyData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => v.slice(5)} interval={4} />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F3F4F6' }} />
              <Bar dataKey="bookings" name="bookings" fill="#2563EB" radius={[3, 3, 0, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Top Categories</h3>
          {analytics.categories.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={analytics.categories} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="count" nameKey="name" paddingAngle={3}>
                  {analytics.categories.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={v => <span className="text-xs text-gray-500">{v}</span>} iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-sm text-gray-400">No booking history yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
