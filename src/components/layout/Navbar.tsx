import { Building2, Calendar, LayoutDashboard, LogIn, LogOut, Search, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="fixed w-full z-50 bg-black/20 backdrop-blur-xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)] supports-[backdrop-filter]:bg-black/10 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-3 space-x-2 group">
              <motion.div 
                whileHover={{ rotate: 180, scale: 1.1 }}
                transition={{ duration: 0.3 }}
                className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.4)]"
              >
                <Building2 className="w-6 h-6 text-white" />
              </motion.div>
              <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 group-hover:to-white transition-colors tracking-tight">
                ServiceBooking
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-2 md:space-x-6">
            <Link 
              to="/search" 
              className="text-gray-300 hover:text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all hover:bg-white/5"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Find Services</span>
            </Link>
            
            {user ? (
              <>
                <Link 
                  to={user.role === 'PROVIDER' ? '/provider/dashboard' : '/customer/dashboard'}
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all hover:bg-white/5"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-red-400 hover:text-red-300 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all hover:bg-red-500/10 border border-transparent"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link 
                  to="/login" 
                  className="text-gray-300 hover:text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all hover:bg-white/10"
                >
                  <LogIn className="w-4 h-4" />
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="bg-white text-black hover:bg-gray-200 px-6 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-105"
                >
                  <User className="w-4 h-4" />
                  Join Now
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
