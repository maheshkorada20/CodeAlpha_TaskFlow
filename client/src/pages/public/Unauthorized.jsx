import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const Unauthorized = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-rose-600/20 text-rose-400 flex items-center justify-center">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-black text-white">403 Forbidden</h1>
      <h2 className="text-base font-bold text-slate-200">Restricted Platform Access</h2>
      <p className="text-xs text-slate-400 max-w-sm">
        You do not possess the required global administrator permissions to access this control interface.
      </p>
      <Link
        to="/dashboard"
        className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold inline-flex items-center gap-2 transition-colors border border-slate-700"
      >
        <ArrowLeft className="w-4 h-4" /> Return to My Dashboard
      </Link>
    </div>
  );
};

export default Unauthorized;
