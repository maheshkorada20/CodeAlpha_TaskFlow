import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  CheckSquare, 
  Calendar, 
  User, 
  Flag, 
  Clock, 
  MessageSquare, 
  Paperclip, 
  Activity, 
  Send, 
  Upload, 
  ExternalLink,
  Play,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { taskService } from '../../services/taskService';
import { commentService } from '../../services/commentService';
import { fileService } from '../../services/fileService';
import { useAuth } from '../../context/AuthContext';

export const TaskDetailPage = () => {
  const { id: taskId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [showReviewInput, setShowReviewInput] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (taskId) {
      loadTaskData();
    }
  }, [taskId]);

  const loadTaskData = async () => {
    try {
      setIsLoading(true);
      const [taskRes, commentsRes, activityRes] = await Promise.all([
        taskService.getTaskById(taskId),
        commentService.getComments(taskId),
        taskService.getTaskActivity(taskId),
      ]);
      setTask(taskRes.data.data.task);
      setComments(commentsRes.data.data.comments || []);
      setActivities(activityRes.data.data.activities || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChecklistToggle = async (index) => {
    if (!task?.checklist) return;
    const updated = task.checklist.map((item, i) =>
      i === index ? { ...item, isCompleted: !item.isCompleted } : item
    );
    setTask(prev => ({ ...prev, checklist: updated }));
    try {
      await taskService.updateChecklist(taskId, { checklist: updated });
    } catch (err) {
      loadTaskData();
    }
  };

  const handleStartTask = async () => {
    try {
      const res = await taskService.updateStatus(taskId, 'IN_PROGRESS');
      setTask(res.data.data.task);
      loadTaskData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start task');
    }
  };

  const handleSubmitForReview = async () => {
    try {
      const res = await taskService.submitForReview(taskId, reviewNotes);
      setTask(res.data.data.task);
      setShowReviewInput(false);
      setReviewNotes('');
      loadTaskData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit review');
    }
  };

  const handleApprove = async () => {
    try {
      const res = await taskService.approveTask(taskId);
      setTask(res.data.data.task);
      loadTaskData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve task');
    }
  };

  const handleReject = async () => {
    const reason = prompt('Provide feedback for requesting changes:');
    if (reason === null) return;
    try {
      const res = await taskService.rejectTask(taskId, reason);
      setTask(res.data.data.task);
      loadTaskData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject task');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const res = await commentService.addComment(taskId, { content: newComment.trim() });
      setComments(prev => [...prev, res.data.data.comment]);
      setNewComment('');
      loadTaskData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add comment');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setIsUploading(true);
      await fileService.uploadTaskAttachment(taskId, file);
      loadTaskData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to upload attachment');
    } finally {
      setIsUploading(false);
      e.target.value = null;
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-xs">Loading task details...</p>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center max-w-lg mx-auto space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Task Not Found</h2>
        <p className="text-xs text-slate-400">{error || 'This task may have been removed or access is restricted.'}</p>
        <Link to="/my-tasks" className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold">
          Return to My Tasks
        </Link>
      </div>
    );
  }

  const isAssigned = task.assignedTo?._id === user?._id || task.assignedTo === user?._id;
  const isManagerOrOwner = task.project?.owner === user?._id || task.project?.owner?._id === user?._id || user?.globalRole === 'admin';

  const totalChecklist = task.checklist?.length || 0;
  const completedChecklist = task.checklist?.filter(i => i.isCompleted).length || 0;
  const checklistPercent = totalChecklist > 0 ? Math.round((completedChecklist / totalChecklist) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {task.project && (
          <Link
            to={`/projects/${task.project._id || task.project}/board`}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
          >
            Project Board →
          </Link>
        )}
      </div>

      {/* Main Task Card */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
        {/* Status bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {task.status.replace('_', ' ')}
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
              {task.priority} Priority
            </span>
          </div>

          {/* Workflow Action Buttons */}
          <div className="flex items-center gap-2">
            {task.status === 'TODO' && (isAssigned || isManagerOrOwner) && (
              <button
                onClick={handleStartTask}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Play className="w-3.5 h-3.5" /> Start Working
              </button>
            )}

            {task.status === 'IN_PROGRESS' && (isAssigned || isManagerOrOwner) && (
              <>
                {!showReviewInput ? (
                  <button
                    onClick={() => setShowReviewInput(true)}
                    className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Clock className="w-3.5 h-3.5" /> Submit for Review
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Submission notes..."
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      className="px-2.5 py-1 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
                    />
                    <button
                      onClick={handleSubmitForReview}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white text-xs rounded-lg font-medium"
                    >
                      Submit
                    </button>
                    <button
                      onClick={() => setShowReviewInput(false)}
                      className="text-xs text-slate-400 hover:text-slate-200"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </>
            )}

            {task.status === 'IN_REVIEW' && isManagerOrOwner && (
              <>
                <button
                  onClick={handleApprove}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approve Task
                </button>
                <button
                  onClick={handleReject}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <XCircle className="w-3.5 h-3.5" /> Request Changes
                </button>
              </>
            )}
          </div>
        </div>

        {/* Title & Description */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-2 leading-snug">{task.title}</h1>
          <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line bg-slate-900/40 p-4 rounded-xl border border-slate-800">
            {task.description || <span className="italic text-slate-500">No description provided.</span>}
          </p>
        </div>

        {/* Meta details */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-slate-850/60 rounded-xl border border-slate-800 text-xs">
          <div>
            <span className="text-slate-400 block mb-1">Assignee</span>
            <div className="flex items-center space-x-2">
              <img
                src={task.assignedTo?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(task.assignedTo?.name || 'User')}&background=6366f1&color=fff`}
                alt={task.assignedTo?.name}
                className="w-5 h-5 rounded-full object-cover"
              />
              <span className="font-semibold text-slate-200">{task.assignedTo?.name || 'Unassigned'}</span>
            </div>
          </div>

          <div>
            <span className="text-slate-400 block mb-1">Target Due Date</span>
            <span className="font-semibold text-slate-200 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              {task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : 'No deadline'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-1">Created By</span>
            <span className="font-semibold text-slate-200">{task.createdBy?.name || 'Project Lead'}</span>
          </div>
        </div>

        {/* Checklist */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-indigo-400" /> Subtasks Checklist ({completedChecklist}/{totalChecklist})
            </h3>
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
                  className="flex items-center space-x-3 p-2.5 bg-slate-850/80 hover:bg-slate-800 rounded-lg border border-slate-800 cursor-pointer transition-colors"
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

        {/* Attachments Section */}
        <div className="pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Paperclip className="w-4 h-4 text-indigo-400" /> Attachments ({task.attachments?.length || 0})
            </h3>
            <label className="cursor-pointer px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm">
              <Upload className="w-3.5 h-3.5" />
              {isUploading ? 'Uploading...' : 'Upload File'}
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
                  className="flex items-center justify-between p-3 bg-slate-850/80 border border-slate-800 rounded-xl"
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <Paperclip className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    <span className="text-xs text-slate-200 truncate">{att.fileName}</span>
                  </div>
                  <a
                    href={att.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-indigo-400 hover:text-indigo-300"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic col-span-2">No attachments uploaded yet.</p>
            )}
          </div>
        </div>

        {/* Discussion / Comments Section */}
        <div className="pt-4 border-t border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-3">
            <MessageSquare className="w-4 h-4 text-indigo-400" /> Task Discussion ({comments.length})
          </h3>

          <div className="space-y-3 mb-4 max-h-72 overflow-y-auto">
            {comments.map(c => (
              <div key={c._id} className="p-3.5 bg-slate-850/80 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-1">
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
            ))}
          </div>

          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Leave a comment or update for the team..."
              className="flex-1 px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Send className="w-3.5 h-3.5" /> Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailPage;
