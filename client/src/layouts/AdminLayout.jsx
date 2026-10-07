import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  Users,
  BarChart3,
  ArrowLeft,
  LogOut,
  Sparkles,
} from 'lucide-react';

export const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { label: 'Overview', path: '/admin', exact: true, icon: BarChart3 },
    { label: 'User Management', path: '/admin/users', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Admin Header */}
      <header className="h-16 bg-slate-900/90 backdrop-blur-md border-b border-purple-500/20 px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/25 ring-1 ring-purple-400/30">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base tracking-tight text-white">TaskFlow Admin</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Console
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Platform Overview & User Operations</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {user && (
            <div className="hidden sm:flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
              <img
                src={
                  user.avatar ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name || 'Admin')}`
                }
                alt={user.name}
                className="w-6 h-6 rounded-lg object-cover ring-1 ring-purple-400/50"
              />
              <div className="text-left">
                <span className="text-xs font-semibold text-slate-200 block leading-tight">{user.name}</span>
                <span className="text-[10px] text-purple-400 font-medium">Administrator</span>
              </div>
            </div>
          )}

          <Link
            to="/dashboard"
            className="flex items-center space-x-1.5 text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700/60"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Workspace</span>
          </Link>

          <button
            onClick={logout}
            className="text-xs text-rose-400 hover:text-rose-300 flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Admin Sidebar */}
        <aside className="w-64 bg-slate-900/60 backdrop-blur-md border-r border-slate-800 p-4 space-y-1.5 shrink-0 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Navigation
            </div>
            {navItems.map((item) => {
              const active = item.exact
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    active
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Quick System Badge */}
          <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20">
            <div className="flex items-center space-x-2 text-purple-300 text-xs font-semibold mb-1">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Role: Administrator</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Authorized access to global statistics and user directory management.
            </p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-950">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
