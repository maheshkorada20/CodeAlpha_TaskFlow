import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight } from 'lucide-react';
import AppLogo from '../components/common/AppLogo';

export const MainLayout = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Public Header */}
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2.5">
            <AppLogo size="w-9 h-9" />
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
              TaskFlow
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
            <Link to="/about" className="hover:text-white transition-colors">About</Link>
            <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
            <Link to="/faq" className="hover:text-white transition-colors">FAQ</Link>
          </nav>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Public Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div className="flex items-center space-x-2">
            <AppLogo size="w-5 h-5" className="rounded-md" />
            <span className="font-semibold text-slate-300">TaskFlow SaaS Platform</span>
          </div>
          <div className="flex items-center space-x-6">
            <Link to="/about" className="hover:text-slate-400">About</Link>
            <Link to="/faq" className="hover:text-slate-400">FAQ</Link>
            <Link to="/contact" className="hover:text-slate-400">Contact</Link>
            <span className="text-slate-600">© 2026 TaskFlow. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
