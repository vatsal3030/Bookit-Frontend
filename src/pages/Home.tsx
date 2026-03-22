import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Search, Star, Shield, Clock, Calendar, ChevronRight, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import SEO from '../components/SEO';

const CATEGORIES = [
  { name: 'Healthcare', icon: '🏥', desc: 'Doctors, dentists, therapists' },
  { name: 'Beauty & Wellness', icon: '💆', desc: 'Salons, spas, grooming' },
  { name: 'Home Services', icon: '🔧', desc: 'Plumbers, electricians, cleaners' },
  { name: 'Education', icon: '📚', desc: 'Tutors, coaches, workshops' },
  { name: 'Fitness', icon: '🏋️', desc: 'Trainers, yoga, sports' },
  { name: 'Legal & Finance', icon: '⚖️', desc: 'Lawyers, accountants, advisors' },
];

const STATS = [
  { value: '50K+', label: 'Users' },
  { value: '10K+', label: 'Providers' },
  { value: '1M+', label: 'Bookings' },
  { value: '4.9/5', label: 'Rating' },
];

const WHY = [
  { icon: Shield, title: 'Trusted & Verified', desc: 'Every provider is manually vetted and reviewed by our team.' },
  { icon: Calendar, title: 'Real-Time Booking', desc: 'See live availability and confirm appointments instantly.' },
  { icon: Star, title: 'Genuine Reviews', desc: 'Read honest reviews from real customers before you book.' },
  { icon: Clock, title: 'On Your Schedule', desc: 'Find slots that work around your busy life, 24/7.' },
];

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <SEO />
      <div className="pt-16 bg-white">
        {/* Hero */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-sm text-blue-700 font-medium mb-6">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            Over 10,000+ professionals available
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight mb-4">
            Book trusted services{' '}
            <span className="text-blue-600">instantly</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-8">
            Find the best local professionals — from doctors to home repairs. Real-time availability, instant confirmations.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/search">
              <Button variant="primary" size="lg" className="gap-2 w-full sm:w-auto">
                <Search className="w-5 h-5" />
                Find a Service
              </Button>
            </Link>
            <Link to="/search?view=map">
              <Button variant="outline" size="lg" className="gap-2 w-full sm:w-auto">
                <Calendar className="w-5 h-5" />
                Search by Map
              </Button>
            </Link>
            {!isAuthenticated && (
              <Link to="/register">
                <Button variant="outline" size="lg" className="gap-2 w-full sm:w-auto">
                  Become a Provider
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-blue-600">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
            {STATS.map(s => (
              <div key={s.label}>
                <div className="text-3xl font-bold">{s.value}</div>
                <div className="text-blue-100 text-sm mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-gray-900">Browse by category</h2>
            <p className="text-gray-500 mt-1">Find exactly the type of service you need</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {CATEGORIES.map(cat => (
              <Link
                key={cat.name}
                to={`/search?category=${encodeURIComponent(cat.name)}`}
                className="group p-5 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 flex items-center gap-4"
              >
                <span className="text-3xl">{cat.icon}</span>
                <div>
                  <p className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{cat.name}</p>
                  <p className="text-sm text-gray-500">{cat.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 ml-auto group-hover:text-blue-500 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Bookit */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-gray-900">Why choose Bookit?</h2>
            <p className="text-gray-500 mt-1">We make booking simple, transparent, and reliable</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {WHY.map(item => (
              <div key={item.title} className="p-6 rounded-xl border border-gray-100 bg-gray-50">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      {!isAuthenticated && (
        <section className="py-16 bg-blue-600">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-white mb-3">Ready to get started?</h2>
            <p className="text-blue-100 mb-8">Join thousands of happy customers who trust Bookit.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/register">
                <Button className="bg-white text-blue-700 hover:bg-blue-50 w-full sm:w-auto" size="lg">
                  Create Free Account
                </Button>
              </Link>
              <Link to="/search">
                <Button className="border border-white/50 text-white hover:bg-white/10 w-full sm:w-auto" size="lg">
                  Browse Services
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          <p className="font-semibold text-white">Bookit — Online Appointment Booking</p>
          <p>© {new Date().getFullYear()} Bookit. All rights reserved.</p>
        </div>
      </footer>
    </div>
    </>
  );
}
