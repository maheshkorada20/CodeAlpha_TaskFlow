import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, Trash2, CheckCheck, ExternalLink } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

export const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } =
    useNotifications();

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        id="notification-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors focus:outline-none"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-indigo-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-84 sm:w-96 glass-dropdown rounded-xl shadow-2xl border border-slate-700/80 z-50 overflow-hidden animate-fade-in">
          <div className="p-3.5 bg-slate-900/90 border-b border-slate-700/80 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-sm text-slate-100">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-indigo-500/20 text-indigo-400 text-xs px-2 py-0.5 rounded-full font-medium">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/80">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-sm">
                No notifications yet
              </div>
            ) : (
              notifications.slice(0, 8).map((n) => (
                <div
                  key={n._id}
                  className={`p-3 text-xs transition-colors hover:bg-slate-800/50 flex items-start justify-between space-x-3 ${
                    !n.isRead ? 'bg-indigo-950/20' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-200 truncate">{n.title}</p>
                    <p className="text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    {!n.isRead && (
                      <button
                        onClick={() => markAsRead(n._id)}
                        className="p-1 hover:text-indigo-400 text-slate-400"
                        title="Mark as read"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(n._id)}
                      className="p-1 hover:text-rose-400 text-slate-500"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <Link
            to="/notifications"
            onClick={() => setIsOpen(false)}
            className="block p-2.5 bg-slate-900/90 text-center text-xs font-medium text-indigo-400 hover:text-indigo-300 border-t border-slate-700/80"
          >
            View all notifications →
          </Link>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
