import React, { useState, useEffect } from 'react';
import { Activity, Clock, User, Filter, Search } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { projectService } from '../../services/projectService';

export const ProjectActivity = ({ projectId }) => {
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (projectId) {
      loadActivities();
    }
  }, [projectId]);

  const loadActivities = async () => {
    try {
      setIsLoading(true);
      const res = await projectService.getProjectActivity(projectId);
      setActivities(res.data.data.activities || []);
    } catch (err) {
      console.error('Failed to load project activities', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredActivities = activities.filter(act => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      (act.description && act.description.toLowerCase().includes(term)) ||
      (act.user?.name && act.user.name.toLowerCase().includes(term)) ||
      (act.action && act.action.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" />
            Project Audit & Activity Log
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Chronological audit trail of task creations, status updates, reviews, and memberships.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search activity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Activity Timeline List */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-sm">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-2">
            <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-400">Loading audit trail...</span>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Activity className="w-10 h-10 stroke-1 mx-auto mb-2 text-slate-600" />
            <p className="text-sm font-medium text-slate-400">No activity recorded.</p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
            {filteredActivities.map(act => (
              <div key={act._id} className="relative group">
                {/* Dot */}
                <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-slate-900 border-2 border-indigo-500 group-hover:border-indigo-400 transition-colors" />

                <div className="bg-slate-850/60 p-4 rounded-xl border border-slate-800 hover:border-slate-750 transition-colors">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center space-x-2">
                      <img
                        src={act.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(act.user?.name || 'User')}&background=6366f1&color=fff`}
                        alt={act.user?.name}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                      <span className="text-xs font-bold text-slate-200">{act.user?.name || 'System'}</span>
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.2 rounded bg-slate-800 text-slate-400">
                        {act.action?.replace('_', ' ')}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {act.createdAt ? format(new Date(act.createdAt), 'MMM d, yyyy h:mm a') : ''}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 pl-7 leading-relaxed">
                    {act.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectActivity;
