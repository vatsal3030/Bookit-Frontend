import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <Link to="/" className="flex items-center gap-2 hover:text-gray-600 transition-colors">
            <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold text-xs">B</div>
            <span className="font-medium text-gray-600">Bookit</span>
          </Link>
          <span>&copy; {new Date().getFullYear()} Bookit. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
