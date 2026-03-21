import { motion } from 'framer-motion';
import { ArrowRight, Search, Star, Shield, Clock, Users, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuroraBackground } from '../components/ui/aurora-background';
import { Spotlight } from '../components/ui/spotlight';
import { BentoGrid, BentoGridItem } from '../components/ui/bento-grid';
import { BackgroundGradient } from '../components/ui/background-gradient';

export default function Home() {
  const navigate = useNavigate();

  const features = [
    {
      title: 'Verified Professionals',
      description: 'Every service provider is thoroughly vetted and verified for your safety and peace of mind.',
      icon: <Shield className="w-8 h-8 text-blue-400 mb-2" />,
      header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10" />
    },
    {
      title: 'Instant Booking',
      description: 'Find available time slots and book appointments instantly without back-and-forth messages.',
      icon: <Clock className="w-8 h-8 text-purple-400 mb-2" />,
      header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10" />
    },
    {
      title: 'Real Reviews',
      description: 'Read genuine reviews from previous customers to make informed decisions.',
      icon: <Star className="w-8 h-8 text-pink-400 mb-2" />,
      header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-pink-500/20 to-orange-500/20 border border-white/10" />
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white selection:bg-blue-500/30">
      
      {/* HERO SECTION WITH AURORA & SPOTLIGHT */}
      <AuroraBackground className="h-screen w-full relative">
        <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="white" />
        
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="relative z-10 flex flex-col items-center justify-center text-center px-4 max-w-5xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/10 backdrop-blur-md mb-8 hover:bg-white/20 transition-colors cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.05)]">
            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
            <span className="text-sm font-medium text-gray-200">Over 10,000+ professionals available</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-tight">
            Book trusted <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 animate-shimmer">
              services instantly
            </span>
          </h1>

          <p className="mt-4 font-normal text-base md:text-xl text-neutral-300 max-w-2xl text-center mx-auto mb-10">
            From doctors to home repairs, find the best professionals near you. 
            Real-time availability, instant confirmations, and genuine reviews.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4">
            <button 
              onClick={() => navigate('/search')}
              className="relative inline-flex h-14 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50 shadow-[0_0_40px_rgba(59,130,246,0.3)] hover:scale-105 transition-transform"
            >
              <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
              <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-8 py-1 text-sm font-semibold text-white backdrop-blur-3xl gap-2 transition-all hover:bg-slate-900">
                <Search className="w-5 h-5" />
                Find a Service
              </span>
            </button>
            
            <button 
              onClick={() => navigate('/register')}
              className="inline-flex h-14 items-center justify-center rounded-full border border-white/20 bg-transparent px-8 py-1 text-sm font-semibold text-white transition-all hover:bg-white/10 gap-2 hover:scale-105"
            >
              Become a Provider <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </AuroraBackground>

      {/* STATS SECTION */}
      <div className="relative z-20 -mt-24 w-full max-w-7xl mx-auto px-4">
        <BackgroundGradient className="rounded-[22px] max-w-full bg-zinc-900">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-8 rounded-[22px] bg-zinc-950/80 backdrop-blur-xl">
            {[
              { value: '50K+', label: 'Happy Customers' },
              { value: '10K+', label: 'Verified Partners' },
              { value: '1M+', label: 'Bookings Made' },
              { value: '4.9/5', label: 'Average Rating' },
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <h3 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">{stat.value}</h3>
                <p className="text-gray-400 text-sm mt-2 font-medium tracking-wide uppercase">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </BackgroundGradient>
      </div>

      {/* FEATURES SECTION (Bento Grid) */}
      <div className="py-32 px-4 max-w-7xl mx-auto w-full">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">Why choose our platform</h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">We provide the best seamlessly animated experience for both customers and service providers to connect.</p>
        </div>

        <BentoGrid>
          {features.map((feature, i) => (
            <BentoGridItem 
              key={i}
              title={feature.title}
              description={feature.description}
              header={feature.header}
              icon={feature.icon}
            />
          ))}
        </BentoGrid>
      </div>

      {/* CATEGORIES SECTION */}
      <section className="py-24 px-4 bg-zinc-900 border-t border-white/5 relative overflow-hidden">
        <Spotlight className="-top-40 right-0 md:right-60 md:-top-20" fill="purple" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">Popular Categories</h2>
              <p className="text-gray-400">Find the specific curated service you need</p>
            </div>
            <button onClick={() => navigate('/search')} className="hidden md:flex text-blue-400 hover:text-blue-300 font-medium items-center gap-1 transition-colors">
              View all <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4">
            {[
              { name: 'Healthcare', icon: <Users className="w-6 h-6" />, count: '1.2k' },
              { name: 'Home Services', icon: <Shield className="w-6 h-6" />, count: '850' },
              { name: 'Beauty & Salon', icon: <Star className="w-6 h-6" />, count: '2.1k' },
              { name: 'Fitness', icon: <Clock className="w-6 h-6" />, count: '430' },
              { name: 'Legal', icon: <Calendar className="w-6 h-6" />, count: '120' },
              { name: 'Consulting', icon: <Search className="w-6 h-6" />, count: '340' },
            ].map((cat, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -5, scale: 1.02 }}
                onClick={() => navigate(`/search?category=${cat.name}`)}
                className="p-6 text-center cursor-pointer bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors backdrop-blur-md shadow-lg"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-blue-400 flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                  {cat.icon}
                </div>
                <h3 className="font-semibold text-white mb-1">{cat.name}</h3>
                <p className="text-xs text-gray-500 font-medium">{cat.count} providers</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <div className="relative py-32 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-blue-600/10 blur-[120px]" />
        <div className="max-w-5xl mx-auto text-center relative z-10 p-12 lg:p-24 rounded-[3rem] border border-white/10 bg-white/5 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 tracking-tight">Ready to transform?</h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Join thousands of service providers who are growing their business and managing appointments effortlessly on our platform.
          </p>
          <button 
            onClick={() => navigate('/register')}
            className="px-10 py-5 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-colors inline-flex items-center gap-2 text-lg shadow-[0_0_40px_rgba(255,255,255,0.4)] hover:scale-105 duration-200"
          >
            Get Started Today <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </div>

    </div>
  );
}
