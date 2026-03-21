import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/toast';
import { useState, useEffect } from 'react';
import { Mail, Lock, User, Phone, Eye, EyeOff, Building2 } from 'lucide-react';
import api from '../../lib/api';

export default function Register() {
  const { register: authRegister, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    contactNo: '', role: 'CUSTOMER' as 'CUSTOMER' | 'PROVIDER',
    businessName: '', category: '', address: '',
  });

  useEffect(() => { if (isAuthenticated) navigate('/dashboard', { replace: true }); }, [isAuthenticated, navigate]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { showToast('Please fill in all required fields', 'warning'); return; }
    if (form.password !== form.confirmPassword) { showToast('Passwords do not match', 'error'); return; }
    if (form.password.length < 6) { showToast('Password must be at least 6 characters', 'warning'); return; }
    if (form.role === 'PROVIDER') { setStep(2); return; }
    handleSubmit();
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await authRegister({
        name: form.name, email: form.email, password: form.password,
        contactNo: form.contactNo, role: form.role,
        ...(form.role === 'PROVIDER' && {
          businessName: form.businessName, category: form.category, address: form.address,
        }),
      });
      showToast('Account created! Welcome to Bookit.', 'success');
      navigate(form.role === 'PROVIDER' ? '/dashboard/provider' : '/dashboard');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Registration failed. Try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const CATEGORIES = ['Healthcare', 'Beauty & Wellness', 'Home Services', 'Education', 'Fitness', 'Legal', 'Finance', 'Other'];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">Bookit</span>
          </Link>
          <h1 className="mt-6 text-3xl font-bold text-gray-900">Create an account</h1>
          <p className="mt-1.5 text-gray-500 text-sm">Join thousands of users on Bookit</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          {/* Role toggle */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg mb-6">
            {(['CUSTOMER', 'PROVIDER'] as const).map(r => (
              <button
                key={r}
                type="button"
                onClick={() => { setForm(p => ({ ...p, role: r })); setStep(1); }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  form.role === r ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {r === 'CUSTOMER' ? 'I am a Customer' : 'I am a Provider'}
              </button>
            ))}
          </div>

          {/* Step 1 */}
          {step === 1 && (
            <form onSubmit={handleStep1} className="space-y-4" noValidate>
              <Input label="Full name" id="name" placeholder="John Doe" value={form.name} onChange={set('name')} icon={<User className="w-4 h-4" />} required />
              <Input label="Email address" id="email" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} icon={<Mail className="w-4 h-4" />} required />
              <Input label="Phone number" id="contactNo" type="tel" placeholder="+91 9876543210" value={form.contactNo} onChange={set('contactNo')} icon={<Phone className="w-4 h-4" />} />
              <div className="w-full">
                <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="reg-password"
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={set('password')}
                    placeholder="Min. 6 characters"
                    className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-300 bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="w-full">
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="confirm-password"
                    type="password"
                    value={form.confirmPassword}
                    onChange={set('confirmPassword')}
                    placeholder="Repeat your password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
              <Button type="submit" variant="primary" className="w-full" size="lg">
                {form.role === 'PROVIDER' ? 'Continue' : 'Create Account'}
              </Button>
            </form>
          )}

          {/* Step 2 — Provider Details */}
          {step === 2 && (
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4" noValidate>
              <div className="flex items-center gap-2 mb-2">
                <button type="button" onClick={() => setStep(1)} className="text-sm text-blue-600 hover:text-blue-700">← Back</button>
                <p className="text-sm text-gray-500">Step 2 of 2 — Business Info</p>
              </div>
              <Input label="Business name" id="businessName" placeholder="Sharma Dental Clinic" value={form.businessName} onChange={set('businessName')} required />
              <div className="w-full">
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  id="category"
                  value={form.category}
                  onChange={set('category')}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select a category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <Input label="Business address" id="address" placeholder="Navrangpura, Ahmedabad" value={form.address} onChange={set('address')} required />
              <Button type="submit" variant="primary" className="w-full" size="lg" loading={loading}>
                Create Provider Account
              </Button>
            </form>
          )}

          <p className="mt-5 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-700">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
