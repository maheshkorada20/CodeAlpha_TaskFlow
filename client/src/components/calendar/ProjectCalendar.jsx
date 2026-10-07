import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  Filter,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isPast
} from 'date-fns';

export const ProjectCalendar = ({ tasks = [], onTaskClick, members = [] }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterMember, setFilterMember] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const today = () => setCurrentDate(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const filteredTasks = tasks.filter(t => {
    if (filterMember && (t.assignedTo?._id !== filterMember && t.assignedTo !== filterMember)) {
      return false;
    }
    if (filterPriority && t.priority !== filterPriority) {
      return false;
    }
    return true;
  });

  const getTasksForDay = (day) => {
    return filteredTasks.filter(t => {
      if (!t.dueDate) return false;
      return isSameDay(new Date(t.dueDate), day);
    });
  };

  const priorityBadgeColor = {
    URGENT: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    HIGH: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    MEDIUM: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    LOW: 'bg-slate-700 text-slate-300 border-slate-600',
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-indigo-400" />
            {format(currentDate, 'MMMM yyyy')}
          </h3>
          <div className="flex items-center space-x-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={prevMonth}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={today}
              className="px-2.5 py-1 text-xs text-slate-300 hover:text-white rounded-lg hover:bg-slate-700 transition-colors font-medium"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-3">
          <select
            value={filterMember}
            onChange={(e) => setFilterMember(e.target.value)}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Assignees</option>
            {members.map(m => {
              const u = m.user || m;
              return <option key={u._id} value={u._id}>{u.name}</option>;
            })}
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
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-850/80 text-center text-xs font-semibold text-slate-400 py-3">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day}>{day}</div>
          ))}
        </div>

        {/* Month days cells */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-800/80">
          {days.map((day, idx) => {
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isCurrentDay = isSameDay(day, new Date());
            const dayTasks = getTasksForDay(day);

            return (
              <div
                key={idx}
                className={`min-h-[110px] p-2 transition-colors ${
                  isCurrentMonth ? 'bg-slate-900/30' : 'bg-slate-950/40 text-slate-600'
                } ${isCurrentDay ? 'ring-1 ring-indigo-500/50 bg-indigo-950/10' : ''}`}
              >
                {/* Date number */}
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                      isCurrentDay
                        ? 'bg-indigo-600 text-white font-bold'
                        : isCurrentMonth
                        ? 'text-slate-300'
                        : 'text-slate-600'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded-md">
                      {dayTasks.length}
                    </span>
                  )}
                </div>

                {/* Tasks pills */}
                <div className="space-y-1 overflow-y-auto max-h-[85px]">
                  {dayTasks.map(t => {
                    const isOverdue = isPast(new Date(t.dueDate)) && t.status !== 'DONE';
                    const isDone = t.status === 'DONE';

                    return (
                      <div
                        key={t._id}
                        onClick={() => onTaskClick && onTaskClick(t)}
                        className={`p-1 rounded-md text-[11px] truncate cursor-pointer transition-all border ${
                          isDone
                            ? 'bg-emerald-950/30 text-emerald-400 border-emerald-500/30 line-through'
                            : isOverdue
                            ? 'bg-rose-950/30 text-rose-300 border-rose-500/40 font-semibold'
                            : priorityBadgeColor[t.priority] || 'bg-slate-800 text-slate-200 border-slate-700'
                        }`}
                        title={`${t.title} (${t.priority}) - ${t.status}`}
                      >
                        {t.title}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProjectCalendar;
