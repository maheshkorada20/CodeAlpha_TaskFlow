import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import analyticsService from '../../services/analyticsService';
import projectService from '../../services/projectService';
import {
  FolderKanban,
  CheckSquare,
  Clock,
  AlertTriangle,
  FileCheck2,
  ArrowRight,
  Plus,
  Flame,
  Calendar,
  Layers,
  Key,
  LogIn,
} from 'lucide-react';
import { format } from 'date-fns';

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      try {
        const [statsRes, projectsRes] = await Promise.all([
          analyticsService.getUserDashboardAnalytics(),
          projectService.getProjects(),
        ]);
        if (statsRes.success && statsRes.data) {
          setAnalytics(statsRes.data);
        }
        if (projectsRes.success && projectsRes.data?.projects) {
          setProjects(projectsRes.data.projects);
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm mt-3">Loading your workspace...</p>
      </div>
    );
  }

  const stats = analytics?.stats || {
    totalProjects: 0,
    totalTasks: 0,
    activeTasks: 0,
    inReviewTasks: 0,
    overdueTasks: 0,
    completedTasks: 0,
  };

  const statCards = [
    {
      label: 'My Projects',
      value: stats.totalProjects,
      sub: `${stats.activeProjects || 0} active`,
      icon: FolderKanban,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
      link: '/projects',
    },
    {
      label: 'Active Tasks',
      value: stats.activeTasks,
      sub: 'In progress or todo',
      icon: CheckSquare,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10',
      border: 'border-sky-500/20',
      link: '/my-tasks?status=IN_PROGRESS',
    },
    {
      label: 'Awaiting Review',
      value: stats.inReviewTasks,
      sub: 'Submitted for sign-off',
      icon: FileCheck2,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      link: '/my-tasks?status=IN_REVIEW',
    },
    {
      label: 'Overdue Tasks',
      value: stats.overdueTasks,
      sub: 'Requires immediate action',
      icon: AlertTriangle,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      link: '/my-tasks',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl glass-panel border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div>
          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
            Workspace Hub
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Welcome back, {user?.name}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Here is your current team workload, pending deliverables, and active milestones.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/projects/new"
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Project</span>
          </Link>
          <Link
            to="/my-tasks"
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold rounded-xl border border-slate-700 transition-all"
          >
            <span>My Tasks</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Google Meet-style Quick Join Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-950/50 via-slate-900/80 to-indigo-950/50 p-5 flex flex-col sm:flex-row sm:items-center gap-4 shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/5 to-violet-600/5 pointer-events-none" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Key className="w-4 h-4 text-violet-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-violet-300">Join a Project</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Got a Project Code from your Team Leader? Enter it here (Google Meet style) to join their workspace instantly.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const code = joinCode.trim().replace(/[-\s]/g, '').toUpperCase();
            if (code) {
              navigate(`/join/${code}`);
            }
          }}
          className="flex items-center gap-2 w-full sm:w-auto"
        >
          <div className="flex items-center gap-2 flex-1 sm:w-64 px-3 py-2.5 bg-slate-900/90 border border-slate-700 focus-within:border-violet-500/60 focus-within:ring-1 focus-within:ring-violet-500/20 rounded-xl transition-all">
            <Key className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Enter code or paste link"
              className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none font-mono tracking-wide"
            />
          </div>
          <button
            type="submit"
            disabled={!joinCode.trim()}
            className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-md shadow-violet-600/30 flex items-center gap-1.5 transition-all flex-shrink-0"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Join</span>
          </button>
        </form>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((c, i) => {
          const Icon = c.icon;
          return (
            <Link
              key={i}
              to={c.link}
              className={`p-5 rounded-2xl glass-panel border ${c.border} hover:scale-[1.02] transition-all flex items-start justify-between`}
            >
              <div>
                <p className="text-xs font-medium text-slate-400">{c.label}</p>
                <h3 className="text-3xl font-bold text-white mt-1.5">{c.value}</h3>
                <p className="text-[11px] text-slate-500 mt-1">{c.sub}</p>
              </div>
              <div className={`p-3 rounded-xl ${c.bg} ${c.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Active Projects & Urgent Tasks Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Projects Preview (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
              <FolderKanban className="w-5 h-5 text-indigo-400" />
              <span>My Projects</span>
            </h2>
            <Link
              to="/projects"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              View all ({projects.length}) →
            </Link>
          </div>

          {projects.length === 0 ? (
            <div className="p-8 text-center rounded-2xl glass-panel border border-slate-800 text-slate-400">
              <p className="text-sm">You haven't joined or created any projects yet.</p>
              <Link
                to="/projects/new"
                className="mt-3 inline-block text-xs font-semibold text-indigo-400 hover:text-indigo-300"
              >
                + Create your first project
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.slice(0, 4).map((p) => (
                <Link
                  key={p._id}
                  to={`/projects/${p._id}`}
                  className="p-5 rounded-2xl glass-panel border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {p.status}
                      </span>
                      <span className="text-xs font-medium text-slate-400">
                        {p.metrics?.progress || 0}% Done
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-100 group-hover:text-indigo-400 transition-colors line-clamp-1">
                      {p.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {p.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80">
                    {/* Progress bar */}
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${p.metrics?.progress || 0}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{p.metrics?.totalTasks || 0} tasks</span>
                      <span>{p.metrics?.membersCount || 1} members</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Urgent Tasks & Deadlines (1 col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
              <Flame className="w-5 h-5 text-amber-400" />
              <span>Urgent Priority Tasks</span>
            </h2>
          </div>

          <div className="p-5 rounded-2xl glass-panel border border-slate-800 divide-y divide-slate-800/80">
            {(!analytics?.urgentTasks || analytics.urgentTasks.length === 0) ? (
              <p className="text-xs text-slate-500 text-center py-6">
                No high-priority or urgent tasks assigned. All caught up!
              </p>
            ) : (
              analytics.urgentTasks.map((t) => (
                <div key={t._id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        t.priority === 'URGENT'
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {t.priority}
                    </span>
                    {t.dueDate && (
                      <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{format(new Date(t.dueDate), 'MMM d')}</span>
                      </span>
                    )}
                  </div>
                  <Link
                    to={`/tasks/${t._id}`}
                    className="text-xs font-semibold text-slate-200 hover:text-indigo-400 transition-colors mt-1 block line-clamp-1"
                  >
                    {t.title}
                  </Link>
                  <span className="text-[10px] text-slate-500 block truncate">
                    {t.project?.name}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
