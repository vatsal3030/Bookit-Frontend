import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { useToast } from '../../components/ui/toast';
import api from '../../lib/api';
import { Bell, CheckCheck, Calendar, DollarSign, Star, Info, Loader2 } from 'lucide-react';

const typeIcons: Record<string, any> = {
  BOOKING: Calendar,
  PAYMENT: DollarSign,
  REVIEW: Star,
  REMINDER: Bell,
  SYSTEM: Info,
};

const typeColor: Record<string, string> = {
  BOOKING: 'bg-blue-50 text-blue-600',
  PAYMENT: 'bg-green-50 text-green-600',
  REVIEW: 'bg-yellow-50 text-yellow-600',
  REMINDER: 'bg-purple-50 text-purple-600',
  SYSTEM: 'bg-gray-100 text-gray-600',
};

export default function Notifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch {
      showToast('Failed to load notifications', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(p => p.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      showToast('All notifications marked as read', 'success');
    } catch { showToast('Failed to update', 'error'); }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(p => p.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(p => Math.max(0, p - 1));
    } catch {}
  };

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-sm text-gray-500 mt-0.5">{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}</p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
              <CheckCheck className="w-4 h-4" /> Mark all read
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <h3 className="font-semibold text-gray-700 mb-1">No notifications</h3>
            <p className="text-sm text-gray-400">You're all caught up!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => {
              const Icon = typeIcons[n.type] || Bell;
              const iconStyle = typeColor[n.type] || 'bg-gray-100 text-gray-600';
              return (
                <div
                  key={n.id}
                  onClick={() => {
                    if (!n.isRead) handleMarkRead(n.id);
                    if (n.link) navigate(n.link);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && !n.isRead && handleMarkRead(n.id)}
                  className={`flex items-start gap-4 p-4 bg-white border rounded-xl transition-all cursor-pointer hover:shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ${
                    !n.isRead ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200'
                  }`}
                  aria-label={`${n.isRead ? '' : 'Unread: '}${n.title}`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${iconStyle}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                      {!n.isRead && <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" aria-hidden="true" />}
                    </div>
                    <p className="text-sm text-gray-600">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
