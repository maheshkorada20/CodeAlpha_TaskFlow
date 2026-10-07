import React, { useState, useEffect } from 'react';
import {
  X,
  CheckSquare,
  Clock,
  Calendar,
  User,
  Flag,
  Tag,
  Paperclip,
  MessageSquare,
  Activity,
  Send,
  Upload,
  Download,
  Trash2,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Edit,
  ExternalLink,
  AlertCircle,
  Sparkles,
  Heart,
  ThumbsUp,
  Award
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { taskService } from '../../services/taskService';
import { commentService } from '../../services/commentService';
import { fileService } from '../../services/fileService';
import { useAuth } from '../../context/AuthContext';

const priorityBadges = {
  URGENT: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  HIGH: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  MEDIUM: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  LOW: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

const statusBadges = {
  TODO: 'bg-slate-800 text-slate-300 border-slate-700',
  IN_PROGRESS: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  IN_REVIEW: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  DONE: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

const APPRECIATIONS = [
  { emoji: '👏', text: 'Great work on this task! 👏' },
  { emoji: '🚀', text: 'Outstanding execution and delivered on time! 🚀' },
  { emoji: '🔥', text: 'Incredible speed and quality! 🔥' },
  { emoji: '⭐', text: 'Excellently done, clean work! ⭐' },
  { emoji: '🎉', text: 'Congratulations on completing this milestone! 🎉' },
];

export const TaskDetailModal = ({
  taskId,
  isOpen,
  onClose,
  onTaskUpdated,
  isManagerOrOwner = false,
  projectMembers = [],
}) => {
  const { user } = useAuth();
  const [task, setTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('discussion');
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [activities, setActivities] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [showReviewInput, setShowReviewInput] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [appreciationSent, setAppreciationSent] = useState(null);
  const [customAppreciation, setCustomAppreciation] = useState('');

  useEffect(() => {
    if (isOpen && taskId) {
      loadTaskDetails();
      loadComments();
      loadActivities();
    }
  }, [isOpen, taskId]);

  const loadTaskDetails = async () => {
    try {
      setIsLoading(true);
      const res = await taskService.getTaskById(taskId);
      const t = res?.data?.task || res?.task || res?.data;
      setTask(t);
    } catch (err) {
      setActionError(err.message || 'Failed to load task details');
    } finally {
      setIsLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const res = await commentService.getComments(taskId);
      const list = res?.data?.comments || res?.comments || (Array.isArray(res?.data) ? res.data : []);
      setComments(list);
    } catch (err) {
      console.error('Failed to load comments', err);
    }
  };

  const loadActivities = async () => {
    try {
      const res = await taskService.getTaskActivity(taskId);
      const list = res?.data?.activities || res?.activities || (Array.isArray(res?.data) ? res.data : []);
      setActivities(list);
    } catch (err) {
      console.error('Failed to load task activity', err);
    }
  };

  if (!isOpen) return null;

  const isAssigned = task?.assignedTo?._id === user?._id || task?.assignedTo === user?._id;
  const isActualOwnerOrManager = Boolean(
    isManagerOrOwner ||
    (task?.project?.owner?._id && user?._id && task.project.owner._id.toString() === user._id.toString()) ||
    (task?.project?.owner && user?._id && task.project.owner.toString() === user._id.toString()) ||
    (task?.createdBy?._id && user?._id && task.createdBy._id.toString() === user._id.toString()) ||
    (task?.createdBy && user?._id && task.createdBy.toString() === user._id.toString()) ||
    user?.globalRole === 'admin'
  );
  const canPerformWorkflow = isAssigned || isActualOwnerOrManager;

  // Quick reassign task
  const handleQuickReassign = async (newAssigneeId) => {
    try {
      await taskService.assignTask(taskId, newAssigneeId || null);
      await loadTaskDetails();
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      setActionError(err.message || 'Failed to reassign task');
    }
  };

  // Checklist toggle
  const handleChecklistToggle = async (itemIndex) => {
    if (!task || !task.checklist) return;
    const updatedChecklist = task.checklist.map((item, i) =>
      i === itemIndex ? { ...item, isCompleted: !item.isCompleted } : item
    );

    setTask(prev => ({ ...prev, checklist: updatedChecklist }));

    try {
      await taskService.updateChecklist(taskId, { checklist: updatedChecklist });
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      loadTaskDetails();
    }
  };

  // Workflow Handlers
  const handleStartTask = async () => {
    try {
      setActionLoading(true);
      const res = await taskService.updateStatus(taskId, 'IN_PROGRESS');
      const updated = res?.data?.task || res?.task || res?.data;
      setTask(updated);
      loadActivities();
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      setActionError(err.message || 'Failed to start task');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitForReview = async () => {
    try {
      setActionLoading(true);
      const res = await taskService.submitForReview(taskId, reviewNotes || 'Work finished and ready for team lead approval.');
      const updated = res?.data?.task || res?.task || res?.data;
      setTask(updated);
      setShowReviewInput(false);
      setReviewNotes('');
      loadActivities();
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      setActionError(err.message || 'Failed to submit review');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setActionLoading(true);
      const res = await taskService.approveTask(taskId);
      const updated = res?.data?.task || res?.task || res?.data;
      setTask(updated);
      loadActivities();
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      setActionError(err.message || 'Failed to approve task');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt('Provide feedback for requesting changes:');
    if (reason === null) return;

    try {
      setActionLoading(true);
      const res = await taskService.rejectTask(taskId, reason);
      const updated = res?.data?.task || res?.task || res?.data;
      setTask(updated);
      loadActivities();
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      setActionError(err.message || 'Failed to reject task');
    } finally {
      setActionLoading(false);
    }
  };

  // Team Leader quick appreciation with emojis
  const handleSendAppreciation = async (app) => {
    try {
      const res = await commentService.createComment(taskId, {
        content: `🏆 Appreciation from Team Lead: ${app.text}`,
      });
      const created = res?.data?.comment || res?.comment || res?.data;
      if (created) {
        setComments(prev => [...prev, created]);
      }
      setAppreciationSent(app.emoji);
      setTimeout(() => setAppreciationSent(null), 4000);
      setActiveTab('discussion');
      loadActivities();
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      setActionError(err.message || 'Failed to post appreciation. Please try again.');
    }
  };

  // Team Leader custom appreciation message
  const handleSendCustomAppreciation = async (e) => {
    if (e) e.preventDefault();
    if (!customAppreciation.trim()) return;
    try {
      const text = customAppreciation.trim();
      const res = await commentService.createComment(taskId, {
        content: `🏆 Appreciation from Team Lead: 🌟 "${text}"`,
      });
      const created = res?.data?.comment || res?.comment || res?.data;
      if (created) {
        setComments(prev => [...prev, created]);
      }
      setAppreciationSent('🌟');
      setCustomAppreciation('');
      setTimeout(() => setAppreciationSent(null), 4000);
      setActiveTab('discussion');
      loadActivities();
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      setActionError(err.message || 'Failed to post custom appreciation.');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await commentService.createComment(taskId, { content: newComment.trim() });
      const created = res?.data?.comment || res?.comment || res?.data;
      if (created) {
        setComments(prev => [...prev, created]);
      } else {
        loadComments();
      }
      setNewComment('');
      loadActivities();
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      setActionError(err.message || 'Failed to add comment');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsUploading(true);
      await fileService.uploadTaskAttachment(taskId, file);
      loadTaskDetails();
      loadActivities();
      if (onTaskUpdated) onTaskUpdated();
    } catch (err) {
      setActionError(err.message || 'Failed to upload attachment');
    } finally {
      setIsUploading(false);
      e.target.value = null;
    }
  };

  const totalChecklist = task?.checklist?.length || 0;
  const completedChecklist = task?.checklist?.filter(i => i.isCompleted).length || 0;
  const checklistPercent = totalChecklist > 0 ? Math.round((completedChecklist / totalChecklist) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center space-x-3">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusBadges[task?.status] || statusBadges.TODO}`}>
              {task?.status?.replace('_', ' ')}
            </span>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${priorityBadges[task?.priority] || priorityBadges.MEDIUM}`}>
              {task?.priority} Priority
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">Loading task workspace...</p>
          </div>
        ) : task ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Error banner */}
            {actionError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{actionError}</span>
                </div>
                <button onClick={() => setActionError('')} className="text-rose-400 hover:text-rose-300">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Workflow Bar - Dynamic Action Bar */}
            <div className="p-4 bg-slate-800/60 border border-slate-750 rounded-2xl flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400 font-medium">Workflow Stage:</span>
                <span className="text-xs font-bold text-slate-200">
                  {task.status === 'TODO' && 'To Do (Ready to start)'}
                  {task.status === 'IN_PROGRESS' && 'In Progress (Active Work)'}
                  {task.status === 'IN_REVIEW' && 'Submitted for Lead Review'}
                  {task.status === 'DONE' && 'Completed & Approved!'}
                </span>
              </div>

              {/* Action Buttons based on status & role */}
              <div className="flex items-center gap-2">
                {task.status === 'TODO' && canPerformWorkflow && (
                  <button
                    onClick={handleStartTask}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-md shadow-blue-600/20"
                  >
                    <Play className="w-3.5 h-3.5" /> Start Task
                  </button>
                )}

                {task.status === 'IN_PROGRESS' && canPerformWorkflow && (
                  <>
                    {!showReviewInput ? (
                      <button
                        onClick={() => setShowReviewInput(true)}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-md shadow-amber-600/20"
                      >
                        <Clock className="w-3.5 h-3.5" /> Mark Completed & Submit Review
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Completion note for Team Lead..."
                          value={reviewNotes}
                          onChange={(e) => setReviewNotes(e.target.value)}
                          className="px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-amber-500"
                        />
                        <button
                          onClick={handleSubmitForReview}
                          disabled={actionLoading}
                          className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs rounded-xl font-bold"
                        >
                          Submit
                        </button>
                        <button
                          onClick={() => setShowReviewInput(false)}
                          className="text-xs text-slate-400 hover:text-slate-200 px-2"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </>
                )}

                {task.status === 'IN_REVIEW' && isManagerOrOwner && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleApprove}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-600/20"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Mark Done
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={actionLoading}
                      className="px-3 py-2 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Request Changes
                    </button>
                  </div>
                )}

                {task.status === 'DONE' && isManagerOrOwner && (
                  <button
                    onClick={handleStartTask}
                    disabled={actionLoading}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Re-open Task
                  </button>
                )}
              </div>
            </div>

            {/* Team Lead Appreciation Reaction Bar (When task is Done, only for Manager/Owner) */}
            {task.status === 'DONE' && isManagerOrOwner && (
              <div className="p-4 bg-gradient-to-r from-emerald-950/40 via-indigo-950/30 to-slate-900 border border-emerald-500/30 rounded-2xl space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-2">
                    <Award className="w-5 h-5 text-amber-400" />
                    <div>
                      <h5 className="text-xs font-bold text-white">
                        Appreciate {task.assignedTo?.name || 'Team Member'}'s Work
                      </h5>
                      <p className="text-[11px] text-slate-400">
                        Click an emoji to send a congratulation comment:
                      </p>
                    </div>
                  </div>

                  {appreciationSent && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-xl animate-fade-in">
                      <span className="text-lg">{appreciationSent}</span>
                      <span className="text-xs font-semibold text-emerald-400">Appreciation sent!</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {APPRECIATIONS.map((app, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendAppreciation(app)}
                      disabled={!!appreciationSent}
                      className="flex items-center gap-1.5 px-3 py-2 bg-slate-800/80 hover:bg-slate-700 disabled:opacity-50 rounded-xl text-sm border border-slate-700 hover:scale-105 transition-all"
                      title={app.text}
                    >
                      <span className="text-lg">{app.emoji}</span>
                      <span className="text-[11px] text-slate-300 font-medium hidden sm:inline">
                        {app.text.replace(/[👏🚀🔥⭐🎉]/g, '').trim().split('!')[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* For team member: show a "your work was completed" badge when DONE */}
            {task.status === 'DONE' && !isManagerOrOwner && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-emerald-300">Task Completed & Approved!</p>
                  <p className="text-[11px] text-slate-400">Great job! Your Team Lead has approved this task.</p>
                </div>
              </div>
            )}

            {/* Title & Description */}
            <div>
              <h2 className="text-xl font-bold text-white mb-2 leading-snug">{task.title}</h2>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
                {task.description || <span className="italic text-slate-500">No description provided.</span>}
              </p>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-850/60 rounded-2xl border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block mb-1">Assignee</span>
                <div className="flex items-center space-x-2">
                  <img
                    src={task.assignedTo?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(task.assignedTo?.name || 'Unassigned')}&background=6366f1&color=fff`}
                    alt={task.assignedTo?.name || 'Unassigned'}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                  <span className="font-semibold text-slate-200 truncate">
                    {task.assignedTo?.name || 'Unassigned'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Due Date</span>
                <span className="font-semibold text-slate-200 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  {task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : 'No deadline'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Created By</span>
                <span className="font-semibold text-slate-200 truncate block">
                  {task.createdBy?.name || 'Project Lead'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Labels</span>
                <div className="flex flex-wrap gap-1">
                  {task.labels && task.labels.length > 0 ? (
                    task.labels.map((lbl, idx) => (
                      <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                        {typeof lbl === 'string' ? lbl : lbl.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-500 italic">None</span>
                  )}
                </div>
              </div>
            </div>

            {/* Checklist / Subtasks Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-indigo-400" /> Subtasks Checklist ({completedChecklist}/{totalChecklist})
                </h4>
                <span className="text-xs font-semibold text-indigo-400">{checklistPercent}% Complete</span>
              </div>

              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full transition-all duration-300 ${
                    checklistPercent === 100 ? 'bg-emerald-500' : 'bg-indigo-500'
                  }`}
                  style={{ width: `${checklistPercent}%` }}
                />
              </div>

              <div className="space-y-1.5">
                {task.checklist && task.checklist.length > 0 ? (
                  task.checklist.map((item, index) => (
                    <label
                      key={index}
                      className="flex items-center space-x-3 p-2.5 bg-slate-850/80 hover:bg-slate-800 rounded-xl border border-slate-800 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={item.isCompleted}
                        onChange={() => handleChecklistToggle(index)}
                        className="w-4 h-4 rounded border-slate-700 text-indigo-600 bg-slate-900 focus:ring-0 cursor-pointer"
                      />
                      <span className={`text-xs ${item.isCompleted ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                        {item.title}
                      </span>
                    </label>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic">No checklist items defined.</p>
                )}
              </div>
            </div>

            {/* Tabs Header: Discussion, Attachments, Activity */}
            <div className="border-t border-slate-800 pt-4">
              <div className="flex space-x-2 border-b border-slate-800 pb-2">
                <button
                  onClick={() => setActiveTab('discussion')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                    activeTab === 'discussion'
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Discussion & Doubts ({comments.length})
                </button>
                <button
                  onClick={() => setActiveTab('attachments')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                    activeTab === 'attachments'
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Paperclip className="w-3.5 h-3.5" /> Attachments & Photos ({task.attachments?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                    activeTab === 'activity'
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" /> Activity Log
                </button>
              </div>

              {/* Tab: Discussion / Comments */}
              {activeTab === 'discussion' && (
                <div className="pt-4 space-y-4">
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {comments.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-4 italic">
                        No comments yet. Have a doubt or question? Ask your teammates below!
                      </p>
                    ) : (
                      comments.map(c => (
                        <div key={c._id} className="p-3 bg-slate-850/80 rounded-xl border border-slate-800">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center space-x-2">
                              <img
                                src={c.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.user?.name || 'User')}&background=6366f1&color=fff`}
                                alt={c.user?.name}
                                className="w-5 h-5 rounded-full object-cover"
                              />
                              <span className="text-xs font-semibold text-slate-200">{c.user?.name}</span>
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {c.createdAt ? formatDistanceToNow(new Date(c.createdAt), { addSuffix: true }) : ''}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 pl-7 leading-relaxed">{c.content}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <form onSubmit={handleAddComment} className="flex gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Ask a doubt or leave a work update..."
                      className="flex-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={!newComment.trim()}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Send className="w-3.5 h-3.5" /> Send
                    </button>
                  </form>
                </div>
              )}

              {/* Tab: Attachments */}
              {activeTab === 'attachments' && (
                <div className="pt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Upload design screenshots, wireframes, or PDFs</span>
                    <label className="cursor-pointer px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors shadow-sm">
                      <Upload className="w-3.5 h-3.5" />
                      {isUploading ? 'Uploading...' : 'Upload Photo / File'}
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {task.attachments && task.attachments.length > 0 ? (
                      task.attachments.map(att => (
                        <div
                          key={att._id}
                          className="flex items-center justify-between p-3 bg-slate-850/80 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors"
                        >
                          <div className="flex items-center space-x-3 overflow-hidden">
                            <Paperclip className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                            <div className="overflow-hidden">
                              <span className="text-xs font-medium text-slate-200 block truncate" title={att.fileName}>
                                {att.fileName}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {att.fileSize ? `${Math.round(att.fileSize / 1024)} KB` : 'Document'}
                              </span>
                            </div>
                          </div>
                          <a
                            href={att.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-400 hover:text-indigo-400 transition-colors"
                            title="Open / Download"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 italic py-4 col-span-2 text-center">
                        No attachments uploaded for this task yet.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Tab: Activity History */}
              {activeTab === 'activity' && (
                <div className="pt-4 space-y-3 max-h-60 overflow-y-auto">
                  {activities.length === 0 ? (
                    <p className="text-xs text-slate-500 italic text-center py-4">No logged activity yet.</p>
                  ) : (
                    activities.map(act => (
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
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default TaskDetailModal;
