import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/toast';
import api from '../../lib/api';
import { Calendar, DollarSign, Star, Users, Clock, ArrowRight, Briefcase, Settings } from 'lucide-react';
import { BackgroundGradient } from '../../components/ui/background-gradient';
import { BentoGrid, BentoGridItem } from '../../components/ui/bento-grid';

export default function ProviderDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [recentAppointments, setRecentAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/providers/dashboard/stats');
        setStats(res.data.stats);
        setRecentAppointments(res.data.recentAppointments || []);
      } catch {
        showToast('Failed to load dashboard', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [showToast]);

  const statCards = stats ? [
    { label: 'Total Bookings', value: stats.totalAppointments, icon: <Calendar className="w-6 h-6 text-white" />, color: 'from-cyan-500 to-blue-500' },
    { label: 'Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: <DollarSign className="w-6 h-6 text-white" />, color: 'from-emerald-400 to-teal-500' },
    { label: 'Upcoming', value: stats.upcomingAppointments, icon: <Clock className="w-6 h-6 text-white" />, color: 'from-orange-400 to-pink-500' },
    { label: 'Rating', value: `${stats.rating?.toFixed(1) || '0.0'}`, icon: <Star className="w-6 h-6 text-white" />, color: 'from-purple-500 to-indigo-500' },
  ] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[85vh] bg-zinc-950">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white pt-24 px-4 pb-12 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full point-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 blur-[120px] rounded-full point-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 tracking-tight">Provider Dashboard</h1>
            <p className="text-blue-400 mt-2 font-medium">Welcome back, {user?.name}!</p>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-wrap gap-3">
            <button 
              onClick={() => navigate('/dashboard/services')}
              className="inline-flex items-center justify-center rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/10 hover:border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.05)]"
            >
              <Briefcase className="w-4 h-4 mr-2 text-purple-400" /> Manage Services
            </button>
            <button 
              onClick={() => navigate('/dashboard/slots')}
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.3)]"
            >
              <Settings className="w-4 h-4 mr-2" /> Manage Slots
            </button>
          </motion.div>
        </div>

        {/* STATS BENTO GRID */}
        <BentoGrid className="mb-16">
          {statCards.map((stat, i) => (
            <BentoGridItem
              key={i}
              title={stat.value}
              description={stat.label}
              header={
                <div className={`flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br ${stat.color} p-4 items-center justify-center shadow-inner opacity-80 group-hover:opacity-100 transition-opacity`}>
                  {stat.icon}
                </div>
              }
            />
          ))}
        </BentoGrid>

        {/* RECENT APPOINTMENTS */}
        <BackgroundGradient className="rounded-[22px] max-w-full bg-zinc-900">
          <div className="bg-zinc-950/90 backdrop-blur-xl rounded-[22px] p-6 md:p-8">
            <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
              <h2 className="text-2xl font-bold text-white tracking-tight">Recent Appointments</h2>
              <button 
                onClick={() => navigate('/dashboard/appointments')} 
                className="text-sm font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors bg-blue-500/10 px-3 py-1.5 rounded-full"
              >
                View all <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {recentAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Calendar className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-lg">No appointments yet.</p>
                <p className="text-sm mt-1">Share your profile to get bookings!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentAppointments.slice(0, 5).map((appt: any, i) => (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    key={appt.id} 
                    className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-lg font-bold shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                        {(appt.customer?.name || 'C').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-base font-semibold text-white truncate group-hover:text-blue-400 transition-colors">{appt.customer?.name}</p>
                        <p className="text-sm text-gray-400">{appt.service?.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 bg-black/20 p-2 rounded-lg">
                      <span className="text-sm text-gray-300 font-medium">{new Date(appt.timeSlot?.date || appt.createdAt).toLocaleDateString()}</span>
                      <Badge status={appt.status} className="shadow-sm" />
                      <span className="text-sm font-bold text-emerald-400">₹{appt.amount}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </BackgroundGradient>
      </div>
    </div>
  );
}
