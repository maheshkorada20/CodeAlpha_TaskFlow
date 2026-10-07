import React from 'react';
import { 
  CheckSquare, 
  Paperclip, 
  MessageSquare, 
  Calendar, 
  AlertCircle, 
  Clock, 
  ArrowRight,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';

const priorityColors = {
  URGENT: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  HIGH: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  MEDIUM: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  LOW: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

const statusColors = {
  TODO: 'bg-slate-800 text-slate-300',
  IN_PROGRESS: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  IN_REVIEW: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  DONE: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
};

export const TaskCard = ({ 
  task, 
  onClick, 
  onQuickMove, 
  isManagerOrOwner, 
  currentUserId 
}) => {
  const isAssignedToMe = task.assignedTo?._id === currentUserId || task.assignedTo === currentUserId;
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'DONE';
  const isDueToday = task.dueDate && isToday(new Date(task.dueDate));

  const totalChecklist = task.checklist ? task.checklist.length : 0;
  const completedChecklist = task.checklist ? task.checklist.filter(item => item.isCompleted).length : 0;
  const checklistPercent = totalChecklist > 0 ? Math.round((completedChecklist / totalChecklist) * 100) : 0;

  return (
    <div 
      onClick={() => onClick(task)}
      className="group bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/40 rounded-xl p-4 transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-indigo-500/5 cursor-pointer relative"
    >
      {/* Labels & Priority */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${priorityColors[task.priority] || priorityColors.MEDIUM}`}>
            {task.priority}
          </span>
          {task.labels && task.labels.map((lbl, idx) => (
            <span 
              key={idx} 
              className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60"
            >
              {typeof lbl === 'string' ? lbl : lbl.name}
            </span>
          ))}
        </div>

        {task.status === 'IN_REVIEW' && (
          <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
            <Clock className="w-2.5 h-2.5" /> Under Review
          </span>
        )}
      </div>

      {/* Task Title */}
      <h4 className="text-sm font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors line-clamp-2 mb-1.5">
        {task.title}
      </h4>

      {/* Description Snippet */}
      {task.description && (
        <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Subtasks / Checklist progress */}
      {totalChecklist > 0 && (
        <div className="mb-3">
          <div className="flex justify-between items-center text-[11px] text-slate-400 mb-1">
            <span className="flex items-center gap-1">
              <CheckSquare className="w-3 h-3 text-indigo-400" />
              Checklist
            </span>
            <span className="font-medium text-slate-300">
              {completedChecklist}/{totalChecklist} ({checklistPercent}%)
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${
                checklistPercent === 100 ? 'bg-emerald-500' : 'bg-indigo-500'
              }`}
              style={{ width: `${checklistPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Bottom Bar: Assignee, Due date, Meta icons */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
        {/* Assignee Avatar */}
        <div className="flex items-center space-x-2">
          {task.assignedTo ? (
            <div className="flex items-center space-x-1.5" title={`Assigned to ${task.assignedTo.name || 'Member'}`}>
              <img 
                src={task.assignedTo.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(task.assignedTo.name || 'User')}&background=6366f1&color=fff`} 
                alt={task.assignedTo.name} 
                className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-700"
              />
              <span className="text-[11px] text-slate-300 max-w-[80px] truncate">
                {task.assignedTo.name ? task.assignedTo.name.split(' ')[0] : 'Member'}
              </span>
            </div>
          ) : (
            <span className="text-[11px] text-slate-500 italic">Unassigned</span>
          )}
        </div>

        {/* Due Date & Counters */}
        <div className="flex items-center space-x-2 text-slate-400">
          {task.dueDate && (
            <span className={`flex items-center gap-1 text-[11px] font-medium ${
              isOverdue 
                ? 'text-rose-400 font-semibold' 
                : isDueToday 
                ? 'text-amber-400 font-semibold' 
                : 'text-slate-400'
            }`}>
              <Calendar className="w-3 h-3" />
              {format(new Date(task.dueDate), 'MMM d')}
            </span>
          )}

          {task.attachmentsCount > 0 && (
            <span className="flex items-center gap-0.5 text-[11px] text-slate-400">
              <Paperclip className="w-3 h-3" />
              {task.attachmentsCount}
            </span>
          )}

          {task.commentsCount > 0 && (
            <span className="flex items-center gap-0.5 text-[11px] text-slate-400">
              <MessageSquare className="w-3 h-3" />
              {task.commentsCount}
            </span>
          )}
        </div>
      </div>

      {/* Quick Move Action overlay for workflow transitions */}
      {onQuickMove && (
        <div 
          onClick={(e) => {
            e.stopPropagation();
            onQuickMove(task);
          }}
          title="Progress to next stage"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-md shadow"
        >
          <ArrowRight className="w-3 h-3" />
        </div>
      )}
    </div>
  );
};

export default TaskCard;
