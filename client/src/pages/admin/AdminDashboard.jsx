import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Users,
  FolderKanban,
  CheckSquare,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Clock,
  CheckCircle2,
  Activity,
  Layers,
} from 'lucide-react';
import { format } from 'date-fns';
import { adminService } from '../../services/adminService';

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentProjects, setRecentProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadOverviewData();
  }, []);

  const loadOverviewData = async () => {
    try {
      setError('');
      const res = await adminService.getDashboardStats();
      const payload = res?.data || res || {};
      setStats(payload.stats || null);
      setRecentUsers(payload.recentUsers || []);
      setRecentProjects(payload.recentProjects || []);
    } catch (err) {
      console.error('Failed to load admin overview:', err);
      setError(err.message || 'Failed to load administrator dashboard data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadOverviewData();
  };

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-xs font-medium">Loading platform overview...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
        <h3 className="text-sm font-bold text-rose-300">Unable to load admin dashboard</h3>
        <p className="text-xs text-rose-400/90">{error}</p>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const completionRate = stats?.totalTasks
    ? Math.round(((stats.completedTasks || 0) / stats.totalTasks) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-900/40 via-slate-900 to-slate-900 p-6 rounded-2xl border border-purple-500/20 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center ring-1 ring-purple-500/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white tracking-tight">Admin Overview</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                System Operational
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">
              High-level overview of platform members, workspaces, and system performance.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link
            to="/admin/users"
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-purple-600/30 transition-all"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Manage Users</span>
            <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
          </Link>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 p-5 rounded-2xl transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Users</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">{stats?.totalUsers || 0}</div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
            <span>{stats?.activeUsers || 0} active</span>
            <span className="text-emerald-400 font-semibold">
              {stats?.totalUsers ? Math.round(((stats.activeUsers || 0) / stats.totalUsers) * 100) : 100}% rate
            </span>
          </div>
        </div>

        {/* Projects */}
        <div className="bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 p-5 rounded-2xl transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Projects</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">{stats?.totalProjects || 0}</div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
            <span>{stats?.activeProjects || 0} active workspaces</span>
            <span className="text-blue-400 font-semibold">{stats?.completedProjects || 0} closed</span>
          </div>
        </div>

        {/* Total Tasks & Completion */}
        <div className="bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 p-5 rounded-2xl transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Tasks</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">{stats?.totalTasks || 0}</div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
            <span>{stats?.completedTasks || 0} completed</span>
            <span className="text-emerald-400 font-semibold">{completionRate}% finished</span>
          </div>
        </div>

        {/* Overdue Tasks */}
        <div className="bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 p-5 rounded-2xl transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Overdue Tasks</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-rose-400">{stats?.overdueTasks || 0}</div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
            <span>Attention needed</span>
            <span className="text-rose-400 font-semibold">Priority</span>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Recent Users & Recent Workspaces */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Members */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" /> Recent User Registrations
              </h2>
              <p className="text-xs text-slate-400">Latest accounts registered on TaskFlow</p>
            </div>
            <Link
              to="/admin/users"
              className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-800/80 mt-2">
            {recentUsers.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">No users found</div>
            ) : (
              recentUsers.map((u) => (
                <div key={u._id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={
                        u.avatar ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name || 'User')}`
                      }
                      alt={u.name}
                      className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-700"
                    />
                    <div>
                      <span className="text-xs font-semibold text-slate-200 block">{u.name}</span>
                      <span className="text-[11px] text-slate-400">{u.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        u.globalRole === 'admin'
                          ? 'bg-purple-500/15 text-purple-300 border border-purple-500/20'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {u.globalRole}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {u.createdAt ? format(new Date(u.createdAt), 'MMM d') : ''}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Workspaces */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-blue-400" /> Recent Projects
              </h2>
              <p className="text-xs text-slate-400">Recently created workspaces across the system</p>
            </div>
          </div>

          <div className="divide-y divide-slate-800/80 mt-2">
            {recentProjects.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">No projects created yet</div>
            ) : (
              recentProjects.map((p) => (
                <div key={p._id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">{p.name}</span>
                    <span className="text-[11px] text-slate-400">
                      Owner: {p.owner?.name || p.owner?.email || 'System'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        p.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {p.status || 'ACTIVE'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {p.createdAt ? format(new Date(p.createdAt), 'MMM d') : ''}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
