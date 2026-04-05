import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gray-900 dark:bg-gray-950 text-gray-400 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-sm font-black">E</span>
              </div>
              <span className="font-extrabold text-lg text-white">Event<span className="text-violet-400">Flow</span></span>
            </Link>
            <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
              Discover, register, and attend amazing events. The simplest way to manage events end-to-end.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3 text-sm">Platform</h4>
            <ul className="space-y-2 text-sm">
              {[['Events', '/events'], ['Register', '/register']].map(([label, to]) => (
                <li key={to}><Link to={to} className="hover:text-violet-400 transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3 text-sm">Account</h4>
            <ul className="space-y-2 text-sm">
              {[['Sign In', '/login'], ['Sign Up', '/register'], ['Dashboard', '/dashboard']].map(([label, to]) => (
                <li key={to}><Link to={to} className="hover:text-violet-400 transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} EventFlow. All rights reserved.</p>
          <p>Built with ❤️ for amazing events</p>
        </div>
      </div>
    </footer>
  );
}
