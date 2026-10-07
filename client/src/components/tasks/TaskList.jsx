import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  CheckSquare, 
  Calendar, 
  User, 
  MoreHorizontal, 
  Edit, 
  Trash2,
  Clock,
  ArrowRight,
  X
} from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';

const priorityBadges = {
  URGENT: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  HIGH: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  MEDIUM: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  LOW: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

const statusBadges = {
  TODO: 'bg-slate-800 text-slate-300 border-slate-700',
  IN_PROGRESS: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  IN_REVIEW: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  DONE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

export const TaskList = ({
  tasks = [],
  members = [],
  onTaskClick,
  onNewTaskClick,
  onDeleteTask,
  isManagerOrOwner = false,
}) => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = !search || 
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = !filterStatus || t.status === filterStatus;
    const matchesPriority = !filterPriority || t.priority === filterPriority;
    const matchesAssignee = !filterAssignee || (t.assignedTo?._id === filterAssignee || t.assignedTo === filterAssignee);

    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
  });

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="DONE">Done</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Assignees</option>
            {members.map(m => {
              const u = m.user || m;
              return <option key={u._id} value={u._id}>{u.name}</option>;
            })}
          </select>

          {(search || filterStatus || filterPriority || filterAssignee) && (
            <button
              onClick={() => {
                setSearch('');
                setFilterStatus('');
                setFilterPriority('');
                setFilterAssignee('');
              }}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {isManagerOrOwner && (
          <button
            onClick={() => onNewTaskClick && onNewTaskClick('TODO')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" /> Add Task
          </button>
        )}
      </div>

      {/* Tasks Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-850/60 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-5">Task</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5">Priority</th>
                <th className="py-3.5 px-5">Assignee</th>
                <th className="py-3.5 px-5">Checklist</th>
                <th className="py-3.5 px-5">Deadline</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-500 italic">
                    No tasks match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredTasks.map(t => {
                  const isOverdue = t.dueDate && isPast(new Date(t.dueDate)) && t.status !== 'DONE';
                  const totalChecklist = t.checklist?.length || 0;
                  const completedChecklist = t.checklist?.filter(i => i.isCompleted).length || 0;

                  return (
                    <tr
                      key={t._id}
                      onClick={() => onTaskClick && onTaskClick(t)}
                      className="hover:bg-slate-850/40 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-5 max-w-xs">
                        <div className="font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors truncate">
                          {t.title}
                        </div>
                        {t.description && (
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">
                            {t.description}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${statusBadges[t.status] || statusBadges.TODO}`}>
                          {t.status.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3.5 px-5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${priorityBadges[t.priority] || priorityBadges.MEDIUM}`}>
                          {t.priority}
                        </span>
                      </td>

                      <td className="py-3.5 px-5">
                        {t.assignedTo ? (
                          <div className="flex items-center space-x-2">
                            <img
                              src={t.assignedTo.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.assignedTo.name || 'User')}&background=6366f1&color=fff`}
                              alt={t.assignedTo.name}
                              className="w-5 h-5 rounded-full object-cover"
                            />
                            <span className="text-slate-300 truncate max-w-[100px]">{t.assignedTo.name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">Unassigned</span>
                        )}
                      </td>

                      <td className="py-3.5 px-5">
                        {totalChecklist > 0 ? (
                          <span className="text-slate-300 font-medium">
                            {completedChecklist}/{totalChecklist}
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-5">
                        {t.dueDate ? (
                          <span className={`flex items-center gap-1 font-medium ${isOverdue ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
                            <Calendar className="w-3.5 h-3.5" />
                            {format(new Date(t.dueDate), 'MMM d')}
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end space-x-1" onClick={(e) => e.stopPropagation()}>
                          {isManagerOrOwner && onDeleteTask && (
                            <button
                              onClick={() => onDeleteTask(t._id)}
                              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                              title="Delete Task"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => onTaskClick && onTaskClick(t)}
                            className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Open Details"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TaskList;
