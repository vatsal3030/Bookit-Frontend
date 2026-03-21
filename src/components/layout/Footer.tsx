import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0b0f19]/60 backdrop-blur-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
              B
            </div>
            <span className="text-sm text-gray-400">
              BookIt — Online Appointment Booking System
            </span>
          </div>

          <div className="flex items-center gap-6 text-sm text-gray-500">
            <span>SE Lab Project</span>
            <span className="flex items-center gap-1">
              Made with <Heart className="w-3 h-3 text-red-400 fill-red-400" /> for Nirma University
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
