import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Shield,
  ShieldAlert,
  UserCheck,
  UserX,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { format } from 'date-fns';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';

export const AdminUsers = () => {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // holds userId being modified
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '' }

  useEffect(() => {
    loadUsers(1);
  }, [roleFilter, statusFilter]);

  const loadUsers = async (page = 1) => {
    try {
      setIsLoading(true);
      const params = {
        page,
        limit: 15,
      };
      if (search.trim()) params.search = search.trim();
      if (roleFilter !== 'ALL') params.role = roleFilter;
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const res = await adminService.getUsers(params);
      const payload = res?.data || res || {};
      const userList = payload.users || payload.items || [];
      setUsers(userList);
      if (payload.pagination) {
        setPagination(payload.pagination);
      }
    } catch (err) {
      console.error('Failed to load admin users:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to fetch users' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadUsers(1);
  };

  const handleToggleStatus = async (user) => {
    if (user._id === currentUser?._id) {
      alert('You cannot deactivate your own administrative account.');
      return;
    }

    try {
      setActionLoading(user._id);
      const res = await adminService.toggleUserStatus(user._id);
      const updatedUser = res?.data?.user || res?.user;
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, isActive: !u.isActive } : u))
      );
      setMessage({
        type: 'success',
        text: `Account for ${user.name} has been ${!user.isActive ? 'activated' : 'deactivated'}.`,
      });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update user status' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleRole = async (user) => {
    if (user._id === currentUser?._id) {
      alert('You cannot modify your own administrator role.');
      return;
    }

    const nextRole = user.globalRole === 'admin' ? 'user' : 'admin';
    const confirmText =
      nextRole === 'admin'
        ? `Are you sure you want to GRANT Administrator privileges to ${user.name}?`
        : `Are you sure you want to REVOKE Administrator privileges from ${user.name}?`;

    if (!window.confirm(confirmText)) return;

    try {
      setActionLoading(user._id);
      await adminService.updateUserRole(user._id, nextRole);
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, globalRole: nextRole } : u))
      );
      setMessage({
        type: 'success',
        text: `Role for ${user.name} updated to ${nextRole.toUpperCase()}.`,
      });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update role' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (user) => {
    if (user._id === currentUser?._id) {
      alert('You cannot delete your own account.');
      return;
    }

    if (!window.confirm(`Permanently delete account for ${user.name} (${user.email})? This action cannot be undone.`)) {
      return;
    }

    try {
      setActionLoading(user._id);
      await adminService.deleteUser(user._id);
      setUsers((prev) => prev.filter((u) => u._id !== user._id));
      setMessage({
        type: 'success',
        text: `Account for ${user.name} was permanently removed.`,
      });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete user' });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center ring-1 ring-purple-500/30">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white tracking-tight">User Management</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/15 text-purple-300 border border-purple-500/20">
                {pagination.total} Total
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">
              Control platform membership, assign administrator privileges, and moderate accounts.
            </p>
          </div>
        </div>

        <button
          onClick={() => loadUsers(pagination.page)}
          disabled={isLoading}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Reload</span>
        </button>
      </div>

      {/* Alert Notifications */}
      {message && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="text-[11px] opacity-70 hover:opacity-100 underline ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[260px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by user name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-20 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-500"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1.5 px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[11px] font-semibold transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex items-center space-x-2">
          {/* Role Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-800/80 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs">
            <Shield className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">All Roles</option>
              <option value="admin" className="bg-slate-900">Admins</option>
              <option value="user" className="bg-slate-900">Users</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-800/80 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">All Statuses</option>
              <option value="active" className="bg-slate-900">Active</option>
              <option value="inactive" className="bg-slate-900">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Directory Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-850/50 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-5">User</th>
                <th className="py-3.5 px-5">Role</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5">Joined Date</th>
                <th className="py-3.5 px-5 text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading user directory...</span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-500">
                    No users matching criteria. Try adjusting your search or filters.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isCurrent = u._id === currentUser?._id;
                  const isBusy = actionLoading === u._id;

                  return (
                    <tr key={u._id} className="hover:bg-slate-850/30 transition-colors">
                      {/* Name & Email */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center space-x-3">
                          <img
                            src={
                              u.avatar ||
                              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name || 'User')}`
                            }
                            alt={u.name}
                            className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-700 shrink-0"
                          />
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="font-semibold text-slate-200">{u.name}</span>
                              {isCurrent && (
                                <span className="text-[10px] font-bold text-purple-400 px-1.5 py-0.2 bg-purple-500/15 rounded">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono">{u.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Global Role */}
                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                            u.globalRole === 'admin'
                              ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                        >
                          <Shield className="w-3 h-3" />
                          <span>{u.globalRole}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                            u.isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.isActive ? 'bg-emerald-400' : 'bg-rose-400'
                            }`}
                          />
                          <span>{u.isActive ? 'Active' : 'Suspended'}</span>
                        </span>
                      </td>

                      {/* Joined Date */}
                      <td className="py-3.5 px-5 text-slate-400">
                        {u.createdAt ? format(new Date(u.createdAt), 'MMM d, yyyy') : '—'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="inline-flex items-center space-x-1.5">
                          {/* Change Role Button */}
                          <button
                            onClick={() => handleToggleRole(u)}
                            disabled={isBusy || isCurrent}
                            title={
                              isCurrent
                                ? 'Cannot modify your own role'
                                : u.globalRole === 'admin'
                                ? 'Demote to regular User'
                                : 'Promote to Administrator'
                            }
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors border ${
                              u.globalRole === 'admin'
                                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                                : 'bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border-purple-500/30'
                            } disabled:opacity-40`}
                          >
                            {u.globalRole === 'admin' ? 'Make User' : 'Make Admin'}
                          </button>

                          {/* Toggle Active Status */}
                          <button
                            onClick={() => handleToggleStatus(u)}
                            disabled={isBusy || isCurrent}
                            title={isCurrent ? 'Cannot deactivate yourself' : 'Toggle status'}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors border ${
                              u.isActive
                                ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30'
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            } disabled:opacity-40`}
                          >
                            {u.isActive ? 'Suspend' : 'Activate'}
                          </button>

                          {/* Delete Account */}
                          {!isCurrent && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              disabled={isBusy}
                              title="Delete account permanently"
                              className="p-1 rounded-lg text-rose-400 hover:text-white hover:bg-rose-600/30 transition-colors disabled:opacity-40"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} users)
            </span>
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => loadUsers(pagination.page - 1)}
                disabled={pagination.page <= 1 || isLoading}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>
              <button
                onClick={() => loadUsers(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages || isLoading}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition-colors flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
