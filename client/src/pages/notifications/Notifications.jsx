import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  FolderKanban, 
  CheckSquare, 
  Users, 
  MessageSquare, 
  Clock, 
  AlertCircle 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications } from '../../context/NotificationContext';

export const Notifications = () => {
  const navigate = useNavigate();
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    isLoading 
  } = useNotifications();

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      await markAsRead(notif._id);
    }
    if (notif.task) {
      navigate(`/tasks/${notif.task._id || notif.task}`);
    } else if (notif.project) {
      navigate(`/projects/${notif.project._id || notif.project}`);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'TASK_ASSIGNED':
      case 'TASK_STATUS_CHANGED':
      case 'TASK_REVIEW_SUBMITTED':
      case 'TASK_APPROVED':
        return <CheckSquare className="w-5 h-5 text-indigo-400" />;
      case 'MEMBER_JOINED':
      case 'MEMBER_REMOVED':
        return <Users className="w-5 h-5 text-emerald-400" />;
      case 'COMMENT_ADDED':
      case 'MENTION':
        return <MessageSquare className="w-5 h-5 text-blue-400" />;
      case 'DEADLINE_APPROACHING':
        return <Clock className="w-5 h-5 text-amber-400" />;
      default:
        return <Bell className="w-5 h-5 text-indigo-400" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-indigo-500" />
            Notifications Center
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Real-time alerts, reviews, assignments, and workspace collaboration updates.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="px-3.5 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <CheckCheck className="w-4 h-4" /> Mark All as Read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-2">
            <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-400">Loading notifications...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center space-y-2 text-slate-500">
            <Bell className="w-12 h-12 stroke-1 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-400">All caught up!</p>
            <p className="text-xs">No pending notifications at this moment.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {notifications.map(notif => (
              <div
                key={notif._id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition-colors cursor-pointer group ${
                  notif.isRead ? 'bg-slate-900/30 hover:bg-slate-850/40' : 'bg-slate-850/70 hover:bg-slate-850 border-l-4 border-indigo-500'
                }`}
              >
                <div className="flex items-start space-x-3.5 flex-1">
                  <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700/60 flex-shrink-0 mt-0.5">
                    {getIcon(notif.type)}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className={`text-xs font-bold ${notif.isRead ? 'text-slate-300' : 'text-white'}`}>
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-slate-500">
                        {notif.createdAt ? formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true }) : ''}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      {notif.message}
                    </p>

                    {notif.project && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-indigo-400 font-medium pt-1">
                        <FolderKanban className="w-3 h-3" />
                        {notif.project.name || 'Project'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => deleteNotification(notif._id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete Notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
