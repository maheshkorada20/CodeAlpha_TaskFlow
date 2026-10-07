import React from 'react';
import { 
  Layers, 
  Calendar, 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  ArrowUpRight,
  Shield,
  Activity,
  Plus
} from 'lucide-react';
import { format, formatDistanceToNow, isPast } from 'date-fns';

export const ProjectOverview = ({ 
  project, 
  stats, 
  tasks = [],
  members = [], 
  activities = [], 
  onNavigateTab,
  onNewTaskClick,
  onTaskClick,
  isManagerOrOwner = false 
}) => {
  if (!project) return null;

  const totalTasks = stats?.totalTasks || tasks.length || 0;
  const completedTasks = stats?.completedTasks || tasks.filter(t => t.status === 'DONE').length || 0;
  const progressPercent = stats?.progress ?? (totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0);
  const isOverdue = project.dueDate && isPast(new Date(project.dueDate)) && project.status !== 'COMPLETED';

  return (
    <div className="space-y-6">
      {/* Hero Banner / Details */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-sm">
        <div className="max-w-3xl space-y-3 relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${
              project.status === 'ACTIVE' 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}>
              {project.status}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {project.priority} Priority
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {project.name}
          </h1>

          <p className="text-slate-300 text-sm leading-relaxed">
            {project.description}
          </p>

          {project.objective && (
            <div className="p-3.5 bg-slate-900/80 border border-slate-800/80 rounded-xl text-xs text-indigo-200">
              <span className="font-bold text-indigo-400 mr-2">Objective:</span>
              {project.objective}
            </div>
          )}

          {/* Timeline & Lead */}
          <div className="flex flex-wrap items-center gap-6 pt-3 text-xs text-slate-400">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>
                {project.startDate ? format(new Date(project.startDate), 'MMM d, yyyy') : 'No start'} 
                {' — '}
                <span className={isOverdue ? 'text-rose-400 font-bold' : ''}>
                  {project.dueDate ? format(new Date(project.dueDate), 'MMM d, yyyy') : 'No deadline'}
                </span>
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-amber-400" />
              <span>Lead: <strong className="text-slate-200">{project.owner?.name || 'Mahesh'}</strong></span>
            </div>
          </div>
        </div>

        {/* Quick CTA Actions */}
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={() => onNavigateTab('board')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-lg shadow-indigo-600/20"
          >
            Open Kanban Board <ArrowUpRight className="w-4 h-4" />
          </button>
          {isManagerOrOwner && (
            <button
              onClick={() => onNewTaskClick && onNewTaskClick('TODO')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              <Plus className="w-4 h-4" /> Add Task
            </button>
          )}
        </div>
      </div>

      {/* Progress & Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Progress Card */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Progress</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white">{progressPercent}%</div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500" 
              style={{ width: `${progressPercent}%` }} 
            />
          </div>
        </div>

        {/* Total Tasks */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Tasks</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalTasks}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {completedTasks} completed
          </span>
        </div>

        {/* In Progress Tasks */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">In Progress</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400">{stats?.inProgressTasks || 0}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {stats?.inReviewTasks || 0} under review
          </span>
        </div>

        {/* Team Members */}
        <div 
          onClick={() => onNavigateTab('team')}
          className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl cursor-pointer hover:border-slate-700 transition-colors group"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Team</span>
            <Users className="w-4 h-4 text-indigo-400 group-hover:text-indigo-300" />
          </div>
          <div className="text-2xl font-black text-white">{members.length}</div>
          <div className="flex -space-x-1.5 overflow-hidden mt-2">
            {members.slice(0, 5).map(m => {
              const u = m.user || m;
              return (
                <img
                  key={u._id}
                  src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'User')}&background=6366f1&color=fff`}
                  alt={u.name}
                  className="w-5 h-5 rounded-full ring-2 ring-slate-900 object-cover"
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Project Tasks Overview Card */}
      <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Project Tasks ({tasks.length})</h3>
          </div>
          <div className="flex items-center space-x-2">
            {isManagerOrOwner && (
              <button
                onClick={() => onNewTaskClick && onNewTaskClick('TODO')}
                className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> New Task
              </button>
            )}
            <button
              onClick={() => onNavigateTab('board')}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
            >
              Open Kanban <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {tasks.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl text-xs text-slate-400">
            <p className="font-semibold text-slate-300 mb-1">No tasks created yet</p>
            <p className="text-slate-500">As team leader, create tasks and assign them to your team members.</p>
            {isManagerOrOwner && (
              <button
                onClick={() => onNewTaskClick && onNewTaskClick('TODO')}
                className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Create First Task
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {tasks.slice(0, 6).map((t) => {
              const statusBadges = {
                TODO: 'bg-slate-800 text-slate-300 border-slate-700',
                IN_PROGRESS: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                IN_REVIEW: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                DONE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
              };

              return (
                <div
                  key={t._id}
                  onClick={() => onTaskClick && onTaskClick(t)}
                  className="p-3.5 bg-slate-850/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl cursor-pointer transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusBadges[t.status] || statusBadges.TODO}`}>
                        {t.status.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {t.priority}
                      </span>
                    </div>
                    <h4 className="text-xs font-semibold text-slate-200 group-hover:text-white line-clamp-1">
                      {t.title}
                    </h4>
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                    <div className="flex items-center space-x-1.5">
                      <img
                        src={t.assignedTo?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.assignedTo?.name || 'Unassigned')}&background=6366f1&color=fff`}
                        alt={t.assignedTo?.name || 'Unassigned'}
                        className="w-4 h-4 rounded-full object-cover"
                      />
                      <span className="truncate max-w-[100px] text-slate-300 font-medium">
                        {t.assignedTo?.name || 'Unassigned'}
                      </span>
                    </div>
                    {t.dueDate && (
                      <span className="text-[10px] text-slate-400">
                        {format(new Date(t.dueDate), 'MMM d')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Two-column Bottom: Recent Activity & Team preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" /> Recent Activity
            </h3>
            <button
              onClick={() => onNavigateTab('activity')}
              className="text-xs text-indigo-400 hover:text-indigo-300"
            >
              View All
            </button>
          </div>

          <div className="space-y-3">
            {activities.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4">No recent activity recorded.</p>
            ) : (
              activities.slice(0, 5).map(act => (
                <div key={act._id} className="flex items-start space-x-3 text-xs border-l-2 border-indigo-500/40 pl-3 py-1">
                  <div className="flex-1">
                    <p className="text-slate-300">
                      <span className="font-semibold text-indigo-300">{act.user?.name || 'Someone'}</span>{' '}
                      {act.description || act.action}
                    </p>
                    <span className="text-[10px] text-slate-500">
                      {act.createdAt ? formatDistanceToNow(new Date(act.createdAt), { addSuffix: true }) : ''}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Team Collaboration Panel */}
        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" /> Active Workspace Collaborators
              </h3>
              <button
                onClick={() => onNavigateTab('team')}
                className="text-xs text-indigo-400 hover:text-indigo-300"
              >
                Manage Team
              </button>
            </div>

            <div className="space-y-2.5">
              {members.slice(0, 4).map(m => {
                const u = m.user || m;
                return (
                  <div key={u._id} className="flex items-center justify-between p-2.5 bg-slate-850 rounded-xl border border-slate-800">
                    <div className="flex items-center space-x-2.5">
                      <img
                        src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'User')}&background=6366f1&color=fff`}
                        alt={u.name}
                        className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-700"
                      />
                      <div>
                        <span className="text-xs font-semibold text-slate-200 block">{u.name}</span>
                        <span className="text-[10px] text-slate-400">{u.email}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {m.role || 'Member'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 mt-4 flex items-center justify-between">
            <span className="text-xs text-slate-400">Need more collaborators?</span>
            <button
              onClick={() => onNavigateTab('team')}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              Generate Invite Link <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectOverview;
