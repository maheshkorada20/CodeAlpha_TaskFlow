import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import {
  User,
  Mail,
  Lock,
  Calendar,
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertCircle,
  Save,
  KeyRound,
} from 'lucide-react';
import { format } from 'date-fns';

export const Profile = () => {
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [stats, setStats] = useState({ projectsCount: 0, completedTasksCount: 0, activeTasksCount: 0 });
  const [profileMsg, setProfileMsg] = useState({ text: '', type: '' });
  const [passMsg, setPassMsg] = useState({ text: '', type: '' });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);

  useEffect(() => {
    if (user?._id) {
      authService
        .getUserProfile(user._id)
        .then((res) => {
          if (res.success && res.data?.stats) {
            setStats(res.data.stats);
          }
        })
        .catch(console.error);
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMsg({ text: '', type: '' });
    setIsSavingProfile(true);
    try {
      const res = await authService.updateProfile({ name, bio, avatar });
      if (res.success && res.data?.user) {
        updateUser(res.data.user);
        setProfileMsg({ text: 'Profile updated successfully!', type: 'success' });
      }
    } catch (err) {
      setProfileMsg({ text: err.message || 'Failed to update profile', type: 'error' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassMsg({ text: '', type: '' });

    if (newPassword !== confirmPassword) {
      setPassMsg({ text: 'New passwords do not match', type: 'error' });
      return;
    }
    if (newPassword.length < 6) {
      setPassMsg({ text: 'Password must be at least 6 characters long', type: 'error' });
      return;
    }

    setIsChangingPass(true);
    try {
      await authService.changePassword({ currentPassword, newPassword });
      setPassMsg({ text: 'Password changed successfully!', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPassMsg({ text: err.message || 'Failed to change password', type: 'error' });
    } finally {
      setIsChangingPass(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
          <User className="w-6 h-6 text-indigo-400" />
          <span>User Profile & Settings</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage your personal details, credentials, and view collaboration stats
        </p>
      </div>

      {/* Header Profile Card */}
      <div className="p-6 rounded-2xl glass-panel border border-slate-800 flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 text-center sm:text-left">
        <img
          src={
            avatar ||
            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
              name || 'User'
            )}`
          }
          alt={name}
          className="w-24 h-24 rounded-2xl object-cover ring-4 ring-indigo-500/20 shadow-xl"
        />
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3">
            <h2 className="text-xl font-bold text-white">{name}</h2>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 w-fit mx-auto sm:mx-0">
              {user?.globalRole}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">{user?.email}</p>
          <p className="text-xs text-slate-300 mt-3 max-w-lg leading-relaxed">
            {bio || 'No bio provided yet.'}
          </p>

          <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-center sm:justify-start space-x-6 text-xs text-slate-400">
            <div className="flex items-center space-x-1.5">
              <FolderKanban className="w-4 h-4 text-indigo-400" />
              <span>{stats.projectsCount} Projects</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{stats.completedTasksCount} Completed Tasks</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-sky-400" />
              <span>{stats.activeTasksCount} Active Tasks</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Edit Profile Form */}
        <div className="p-6 rounded-2xl glass-panel border border-slate-800">
          <h3 className="text-base font-bold text-white mb-4 flex items-center space-x-2">
            <Save className="w-4 h-4 text-indigo-400" />
            <span>Edit Profile Info</span>
          </h3>

          {profileMsg.text && (
            <div
              className={`mb-4 p-3 rounded-xl text-xs flex items-center space-x-2 ${
                profileMsg.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{profileMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Display Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Avatar Image URL
              </label>
              <input
                type="url"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Bio</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Briefly describe your role and expertise..."
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSavingProfile}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center space-x-1.5"
            >
              <span>Save Profile</span>
            </button>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="p-6 rounded-2xl glass-panel border border-slate-800">
          <h3 className="text-base font-bold text-white mb-4 flex items-center space-x-2">
            <KeyRound className="w-4 h-4 text-indigo-400" />
            <span>Change Password</span>
          </h3>

          {passMsg.text && (
            <div
              className={`mb-4 p-3 rounded-xl text-xs flex items-center space-x-2 ${
                passMsg.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{passMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={isChangingPass}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs border border-slate-700 transition-all flex items-center space-x-1.5"
            >
              <span>Update Password</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
