import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Search, LayoutDashboard, LogOut, User, Shield,
  ChevronDown, Building2, MessageSquare, Plus, Check, Bell, Receipt
} from 'lucide-react';
import api from '../../lib/api';
import { cn } from '../../lib/utils';

// ─── Multi-Account Helpers ────────────────────────────────
interface SavedAccount { id: string; name: string; email: string; avatar?: string; role: string; token: string; }

function getSavedAccounts(): SavedAccount[] {
  try { return JSON.parse(localStorage.getItem('bookit_accounts') || '[]'); } catch { return []; }
}
function upsertSavedAccount(account: SavedAccount) {
  const accounts = getSavedAccounts().filter(a => a.id !== account.id);
  localStorage.setItem('bookit_accounts', JSON.stringify([account, ...accounts].slice(0, 5)));
}
function removeSavedAccount(id: string) {
  localStorage.setItem('bookit_accounts', JSON.stringify(getSavedAccounts().filter(a => a.id !== id)));
}

// ─── Navbar ───────────────────────────────────────────────
export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const [accounts, setAccounts] = useState<SavedAccount[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Sync current user into savedAccounts and fetch notifications
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (user && token) {
      upsertSavedAccount({ id: user.id, name: user.name, email: user.email, avatar: user.avatar, role: user.role, token });
      fetchNotifications();
    }
    setAccounts(getSavedAccounts());
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {}
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setUnreadCount(0);
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch {}
  };

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setUnreadCount(Math.max(0, unreadCount - 1));
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch {}
  };

  // Close menus on outside click / Escape
  useEffect(() => {
    const handler = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent && e.key !== 'Escape') return;
      if (e instanceof MouseEvent) {
        if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
        if (!notifRef.current?.contains(e.target as Node)) setNotifOpen(false);
      } else {
        setMenuOpen(false);
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', handler);
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('keydown', handler); };
  }, []);

  const handleLogout = () => {
    if (user) removeSavedAccount(user.id);
    logout();
    setMenuOpen(false);
    navigate('/');
    setAccounts(getSavedAccounts());
  };

  const handleSwitchAccount = (acc: SavedAccount) => {
    // Store the selected account's token and reload
    localStorage.setItem('token', acc.token);
    localStorage.setItem('user', JSON.stringify({ id: acc.id, name: acc.name, email: acc.email, avatar: acc.avatar, role: acc.role, isVerified: true }));
    setMenuOpen(false);
    window.location.href = '/dashboard';
  };

  const isActive = (path: string) => location.pathname.startsWith(path);

  const dashPath = user?.role === 'PROVIDER' ? '/dashboard/provider' : '/dashboard';
  const initials = user ? (user.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '';

  const navLinks = [
    { to: '/search', label: 'Find Services', icon: Search },
    { to: '/dashboard/messages', label: 'Messages', icon: MessageSquare, auth: true },
    { to: dashPath, label: 'Dashboard', icon: LayoutDashboard, auth: true },
  ];

  return (
    <nav
      className="fixed top-0 inset-x-0 z-50 h-16 bg-white border-b border-gray-200 shadow-sm"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-4">
        {/* Brand */}
        <Link
          to="/"
          className="flex items-center gap-2 flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg"
          aria-label="Bookit — go to home"
        >
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900 tracking-tight">Bookit</span>
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-1">
          {navLinks.map(link => {
            if (link.auth && !user) return null;
            const Icon = link.icon;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                  isActive(link.to)
                    ? "text-blue-700 bg-blue-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                )}
                aria-current={isActive(link.to) ? 'page' : undefined}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{link.label}</span>
              </Link>
            );
          })}

          {/* Admin link */}
          {user?.role === 'ADMIN' && (
            <Link
              to="/admin/dashboard"
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400",
                isActive('/admin')
                  ? "text-red-700 bg-red-50"
                  : "text-red-600 hover:bg-red-50"
              )}
            >
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}

          {/* Auth: Guest */}
          {!user && (
            <div className="flex items-center gap-2 ml-2">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                Get Started
              </Link>
            </div>
          )}

          {/* Auth: User Profile & Notifications */}
          {user && (
            <div className="flex items-center gap-2 ml-2">
              
              {/* Notifications */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg animate-fadeIn z-50">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                      {unreadCount > 0 && (
                        <button onClick={markAllAsRead} className="text-xs text-blue-600 font-medium hover:text-blue-700">
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-gray-500">No notifications</div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {notifications.map(n => (
                            <div 
                              key={n.id} 
                              onClick={() => !n.isRead && markAsRead(n.id)}
                              className={cn(
                                "px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer",
                                !n.isRead && "bg-blue-50/50"
                              )}
                            >
                              <p className="text-sm font-medium text-gray-900">{n.title}</p>
                              <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{n.message}</p>
                              <p className="text-xs text-gray-400 mt-2">{new Date(n.createdAt).toLocaleDateString()}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Avatar Dropdown */}
              <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(v => !v)}
                aria-expanded={menuOpen}
                aria-haspopup="true"
                aria-label="Open user menu"
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                {/* Avatar */}
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover border border-gray-200" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {initials}
                  </div>
                )}
                <span className="hidden sm:block text-sm font-medium text-gray-800 max-w-[100px] truncate">{user.name.split(' ')[0]}</span>
                <ChevronDown className={cn("w-4 h-4 text-gray-500 transition-transform", menuOpen && "rotate-180")} />
              </button>

              {/* Dropdown */}
              {menuOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-lg py-1 animate-fadeIn"
                  role="menu"
                  aria-label="User menu"
                >
                  {/* Current user */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                          {initials}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    </div>
                    <span className="mt-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                      {user.role}
                    </span>
                  </div>

                  {/* Links */}
                  <div className="py-1" role="group">
                    <Link
                      to="/dashboard/profile"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <User className="w-4 h-4 text-gray-400" />
                      My Profile
                    </Link>
                    <Link
                      to={dashPath}
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-gray-400" />
                      Dashboard
                    </Link>
                    <Link
                      to="/dashboard/payments"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Receipt className="w-4 h-4 text-gray-400" />
                      Payment History
                    </Link>
                  </div>

                  {/* Saved Accounts */}
                  {accounts.filter(a => a.id !== user.id).length > 0 && (
                    <>
                      <div className="border-t border-gray-100 px-4 pt-2 pb-1">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Switch Account</p>
                      </div>
                      <div className="pb-1" role="group">
                        {accounts
                          .filter(a => a.id !== user.id)
                          .map(acc => (
                            <button
                              key={acc.id}
                              role="menuitem"
                              onClick={() => handleSwitchAccount(acc)}
                              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                            >
                              <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                {acc.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{acc.name}</p>
                                <p className="text-xs text-gray-400 truncate">{acc.email}</p>
                              </div>
                            </button>
                          ))}
                        <Link
                          to="/login"
                          role="menuitem"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Add another account
                        </Link>
                      </div>
                    </>
                  )}

                  {/* Logout */}
                  <div className="border-t border-gray-100 py-1">
                    <button
                      role="menuitem"
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>

            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
