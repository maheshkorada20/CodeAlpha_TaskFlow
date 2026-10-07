import React from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { Bell, X } from 'lucide-react';

export const ToastNotification = () => {
  const { toastNotification, clearToast } = useNotifications();

  if (!toastNotification) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-slate-900 border border-indigo-500/40 shadow-2xl rounded-xl p-4 flex items-start space-x-3 animate-fade-in text-white backdrop-blur-md">
      <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg shrink-0">
        <Bell className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-slate-100">{toastNotification.title}</h4>
        <p className="text-xs text-slate-300 mt-1 line-clamp-2">{toastNotification.message}</p>
      </div>
      <button
        onClick={clearToast}
        className="text-slate-400 hover:text-white p-1"
        title="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ToastNotification;
