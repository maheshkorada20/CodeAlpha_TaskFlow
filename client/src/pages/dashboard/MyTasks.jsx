import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import taskService from '../../services/taskService';
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  FileCheck2,
  Calendar,
  Filter,
  CheckCircle2,
  Search,
} from 'lucide-react';
import { format } from 'date-fns';

export const MyTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [categorized, setCategorized] = useState({
    today: [],
    upcoming: [],
    overdue: [],
    inProgress: [],
    inReview: [],
    completed: [],
  });
  const [counts, setCounts] = useState({});
  const [activeTab, setActiveTab] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchMyTasks = async () => {
    setIsLoading(true);
    try {
      const res = await taskService.getMyTasks();
      if (res.success && res.data) {
        setTasks(res.data.tasks || []);
        setCategorized(res.data.categorized || {});
        setCounts(res.data.counts || {});
      }
    } catch (err) {
      console.error('Error fetching my tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTasks();
  }, []);

  const getFilteredTasks = () => {
    let list = tasks;

    if (activeTab === 'TODAY') list = categorized.today || [];
    else if (activeTab === 'UPCOMING') list = categorized.upcoming || [];
    else if (activeTab === 'OVERDUE') list = categorized.overdue || [];
    else if (activeTab === 'IN_PROGRESS') list = categorized.inProgress || [];
    else if (activeTab === 'IN_REVIEW') list = categorized.inReview || [];
    else if (activeTab === 'COMPLETED') list = categorized.completed || [];

    if (priorityFilter !== 'ALL') {
      list = list.filter((t) => t.priority === priorityFilter);
    }

    if (search.trim()) {
      const reg = new RegExp(search.trim(), 'i');
      list = list.filter((t) => reg.test(t.title) || reg.test(t.description));
    }

    return list;
  };

  const tabs = [
    { key: 'ALL', label: 'All Tasks', count: counts.total || 0 },
    { key: 'TODAY', label: 'Due Today', count: counts.today || 0 },
    { key: 'UPCOMING', label: 'Upcoming', count: counts.upcoming || 0 },
    { key: 'OVERDUE', label: 'Overdue', count: counts.overdue || 0, badgeColor: 'text-rose-400 bg-rose-500/20' },
    { key: 'IN_PROGRESS', label: 'In Progress', count: counts.inProgress || 0 },
    { key: 'IN_REVIEW', label: 'In Review', count: counts.inReview || 0, badgeColor: 'text-amber-400 bg-amber-500/20' },
    { key: 'COMPLETED', label: 'Completed', count: counts.completed || 0 },
  ];

  const displayedTasks = getFilteredTasks();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <CheckSquare className="w-6 h-6 text-indigo-400" />
            <span>My Assigned Tasks</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track and execute deliverables across all your collaborative projects
          </p>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center space-x-1 overflow-x-auto pb-2 border-b border-slate-800">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-2 ${
              activeTab === tab.key
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                tab.badgeColor || (activeTab === tab.key ? 'bg-indigo-800 text-white' : 'bg-slate-800 text-slate-400')
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Filter tasks by keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400">Priority:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
      </div>

      {/* Tasks Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-400">Loading your tasks...</p>
        </div>
      ) : displayedTasks.length === 0 ? (
        <div className="p-12 text-center rounded-2xl glass-panel border border-slate-800 text-slate-400">
          <CheckCircle2 className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-medium">No tasks found in this view.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedTasks.map((t) => (
            <Link
              key={t._id}
              to={`/tasks/${t._id}`}
              className="p-5 rounded-2xl glass-panel border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      t.status === 'DONE'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : t.status === 'IN_REVIEW'
                        ? 'bg-amber-500/20 text-amber-400'
                        : t.status === 'IN_PROGRESS'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {t.status}
                  </span>

                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                      t.priority === 'URGENT'
                        ? 'bg-rose-500/20 text-rose-400'
                        : t.priority === 'HIGH'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {t.priority}
                  </span>
                </div>

                <h3 className="font-semibold text-slate-100 group-hover:text-indigo-400 transition-colors line-clamp-1">
                  {t.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  {t.description || 'No description provided'}
                </p>

                {t.project && (
                  <span className="text-[10px] text-indigo-400 font-medium mt-2 block truncate">
                    📁 {t.project.name}
                  </span>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                {t.dueDate ? (
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>{format(new Date(t.dueDate), 'MMM d, yyyy')}</span>
                  </span>
                ) : (
                  <span>No deadline</span>
                )}

                {t.checklist && t.checklist.length > 0 && (
                  <span className="text-[10px] font-mono text-slate-500">
                    ☑ {t.checklist.filter((c) => c.completed).length}/{t.checklist.length}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTasks;
