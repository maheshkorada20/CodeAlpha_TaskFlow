import React, { useState } from 'react';
import { 
  Plus, 
  Filter, 
  Search, 
  MoreHorizontal, 
  CheckCircle2, 
  Clock, 
  Play, 
  ListFilter,
  X
} from 'lucide-react';
import TaskCard from '../tasks/TaskCard';
import { taskService } from '../../services/taskService';

const COLUMNS = [
  { id: 'TODO', title: 'To Do', color: 'border-slate-700 bg-slate-900/40 text-slate-300' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'border-blue-500/30 bg-blue-950/20 text-blue-400' },
  { id: 'IN_REVIEW', title: 'In Review', color: 'border-amber-500/30 bg-amber-950/20 text-amber-400' },
  { id: 'DONE', title: 'Done', color: 'border-emerald-500/30 bg-emerald-950/20 text-emerald-400' },
];

export const KanbanBoard = ({
  tasks = [],
  projectId,
  members = [],
  onTaskClick,
  onNewTaskClick,
  onTaskStatusChange,
  isManagerOrOwner = false,
  currentUserId,
}) => {
  const [search, setSearch] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [draggedTaskId, setDraggedTaskId] = useState(null);

  // Filter tasks based on search & selectors
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = search === '' || 
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(search.toLowerCase()));

    const matchesAssignee = filterAssignee === '' ||
      (task.assignedTo?._id === filterAssignee || task.assignedTo === filterAssignee);

    const matchesPriority = filterPriority === '' || task.priority === filterPriority;

    return matchesSearch && matchesAssignee && matchesPriority;
  });

  // Group tasks by column status
  const tasksByColumn = {
    TODO: filteredTasks.filter(t => t.status === 'TODO'),
    IN_PROGRESS: filteredTasks.filter(t => t.status === 'IN_PROGRESS'),
    IN_REVIEW: filteredTasks.filter(t => t.status === 'IN_REVIEW'),
    DONE: filteredTasks.filter(t => t.status === 'DONE'),
  };

  // Drag and Drop handlers
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, columnStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    setDraggedTaskId(null);

    if (!taskId) return;
    const task = tasks.find(t => t._id === taskId);
    if (!task || task.status === columnStatus) return;

    if (onTaskStatusChange) {
      onTaskStatusChange(taskId, columnStatus);
    }
  };

  const handleQuickMove = (task) => {
    const sequence = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
    const currentIndex = sequence.indexOf(task.status);
    if (currentIndex < sequence.length - 1) {
      const nextStatus = sequence[currentIndex + 1];
      if (onTaskStatusChange) {
        onTaskStatusChange(task._id, nextStatus);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar: Filters & Quick Add */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Filter Assignee */}
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Members</option>
            {members.map(m => {
              const u = m.user || m;
              return (
                <option key={u._id} value={u._id}>
                  {u.name}
                </option>
              );
            })}
          </select>

          {/* Filter Priority */}
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

          {(search || filterAssignee || filterPriority) && (
            <button
              onClick={() => {
                setSearch('');
                setFilterAssignee('');
                setFilterPriority('');
              }}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Clear filters"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Create Task Button */}
        {isManagerOrOwner && (
          <button
            onClick={() => onNewTaskClick && onNewTaskClick('TODO')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" /> New Task
          </button>
        )}
      </div>

      {/* Kanban Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {COLUMNS.map(col => {
          const colTasks = tasksByColumn[col.id] || [];

          return (
            <div
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
              className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-3.5 flex flex-col min-h-[500px] transition-colors"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 px-1">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-slate-200">{col.title}</span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${col.color}`}>
                    {colTasks.length}
                  </span>
                </div>

                {isManagerOrOwner && (
                  <button
                    onClick={() => onNewTaskClick && onNewTaskClick(col.id)}
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    title={`Add task to ${col.title}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Tasks List / Drop Zone */}
              <div className="space-y-3 flex-1 overflow-y-auto pr-0.5">
                {colTasks.length === 0 ? (
                  <div className="h-32 border-2 border-dashed border-slate-800 rounded-xl flex items-center justify-center text-xs text-slate-500 italic">
                    Drop tasks here
                  </div>
                ) : (
                  colTasks.map(task => (
                    <div
                      key={task._id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task._id)}
                      className="cursor-grab active:cursor-grabbing"
                    >
                      <TaskCard
                        task={task}
                        onClick={onTaskClick}
                        onQuickMove={handleQuickMove}
                        isManagerOrOwner={isManagerOrOwner}
                        currentUserId={currentUserId}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KanbanBoard;
