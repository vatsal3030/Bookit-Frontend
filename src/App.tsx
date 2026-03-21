import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './components/ui/toast';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Search from './pages/Search';
import ProviderProfile from './pages/providers/ProviderProfile';
import Appointments from './pages/dashboard/Appointments';
import Payment from './pages/checkout/Payment';
import ProviderDashboard from './pages/dashboard/ProviderDashboard';
import ManageServices from './pages/dashboard/ManageServices';
import ManageSlots from './pages/dashboard/ManageSlots';
import Profile from './pages/dashboard/Profile';
import Messages from './pages/dashboard/Messages';
import Notifications from './pages/dashboard/Notifications';
import Payments from './pages/dashboard/Payments';
import AdminDashboard from './pages/admin/AdminDashboard';

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <ToastProvider>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Public */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/search" element={<Search />} />
                <Route path="/providers/:id" element={<ProviderProfile />} />

                {/* Protected - Any authenticated user */}
                <Route path="/dashboard" element={<ProtectedRoute><Appointments /></ProtectedRoute>} />
                <Route path="/dashboard/appointments" element={<ProtectedRoute><Appointments /></ProtectedRoute>} />
                <Route path="/dashboard/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/dashboard/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                <Route path="/dashboard/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
                <Route path="/checkout/:id" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
                <Route path="/dashboard/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />

                {/* Protected - Provider only */}
                <Route path="/dashboard/provider" element={<ProtectedRoute requiredRole="PROVIDER"><ProviderDashboard /></ProtectedRoute>} />
                <Route path="/dashboard/services" element={<ProtectedRoute requiredRole="PROVIDER"><ManageServices /></ProtectedRoute>} />
                <Route path="/dashboard/slots" element={<ProtectedRoute requiredRole="PROVIDER"><ManageSlots /></ProtectedRoute>} />

                {/* Protected - Admin only */}
                <Route path="/admin/dashboard" element={<ProtectedRoute requiredRole="ADMIN"><AdminDashboard /></ProtectedRoute>} />
              </Routes>
            </main>
            <Footer />
          </div>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
