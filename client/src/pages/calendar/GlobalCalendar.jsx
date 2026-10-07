import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
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
import { taskService } from '../../services/taskService';
import TaskDetailModal from '../../components/tasks/TaskDetailModal';

export const GlobalCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [detailTaskId, setDetailTaskId] = useState(null);

  useEffect(() => {
    loadMyTasks();
  }, []);

  const loadMyTasks = async () => {
    try {
      setIsLoading(true);
      const res = await taskService.getMyTasks();
      setTasks(res.data.data.tasks || []);
    } catch (err) {
      console.error('Failed to load tasks for calendar', err);
    } finally {
      setIsLoading(false);
    }
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const today = () => setCurrentDate(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const getTasksForDay = (day) => {
    return tasks.filter(t => {
      if (!t.dueDate) return false;
      return isSameDay(new Date(t.dueDate), day);
    });
  };

  const priorityColors = {
    URGENT: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    HIGH: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    MEDIUM: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    LOW: 'bg-slate-700 text-slate-300 border-slate-600',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2.5">
            <CalendarIcon className="w-6 h-6 text-indigo-500" />
            Global Schedule & Deadlines
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Unified calendar of milestones, deliverables, and assigned project tasks.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm font-bold text-slate-200 mr-2">
            {format(currentDate, 'MMMM yyyy')}
          </span>
          <div className="flex items-center space-x-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={prevMonth}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={today}
              className="px-2.5 py-1 text-xs text-slate-300 hover:text-white rounded-lg hover:bg-slate-700 font-medium"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-850/80 text-center text-xs font-semibold text-slate-400 py-3">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d}>{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-800/80">
          {days.map((day, idx) => {
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isCurrentDay = isSameDay(day, new Date());
            const dayTasks = getTasksForDay(day);

            return (
              <div
                key={idx}
                className={`min-h-[120px] p-2 transition-colors ${
                  isCurrentMonth ? 'bg-slate-900/30' : 'bg-slate-950/40 text-slate-600'
                } ${isCurrentDay ? 'ring-1 ring-indigo-500/50 bg-indigo-950/10' : ''}`}
              >
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

                <div className="space-y-1 overflow-y-auto max-h-[90px]">
                  {dayTasks.map(t => {
                    const isOverdue = isPast(new Date(t.dueDate)) && t.status !== 'DONE';
                    const isDone = t.status === 'DONE';

                    return (
                      <div
                        key={t._id}
                        onClick={() => setDetailTaskId(t._id)}
                        className={`p-1 rounded-md text-[11px] truncate cursor-pointer transition-all border ${
                          isDone
                            ? 'bg-emerald-950/30 text-emerald-400 border-emerald-500/30 line-through'
                            : isOverdue
                            ? 'bg-rose-950/30 text-rose-300 border-rose-500/40 font-semibold'
                            : priorityColors[t.priority] || 'bg-slate-800 text-slate-200 border-slate-700'
                        }`}
                        title={`${t.title} (${t.project?.name || 'Project'})`}
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

      <TaskDetailModal
        taskId={detailTaskId}
        isOpen={Boolean(detailTaskId)}
        onClose={() => setDetailTaskId(null)}
        onTaskUpdated={loadMyTasks}
      />
    </div>
  );
};

export default GlobalCalendar;
