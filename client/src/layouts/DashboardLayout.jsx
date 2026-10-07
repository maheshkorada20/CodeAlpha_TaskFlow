import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { useTheme } from '../context/ThemeContext';
import AppLogo from '../components/common/AppLogo';
import NotificationDropdown from '../components/notifications/NotificationDropdown';
import ToastNotification from '../components/notifications/ToastNotification';
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Calendar,
  Bell,
  User,
  Shield,
  LogOut,
  Menu,
  X,
  Layers,
  Users,
  MessageSquare,
  FileText,
  Activity,
  BarChart3,
  Settings,
  Plus,
  Search,
  Sun,
  Moon,
} from 'lucide-react';

export const DashboardLayout = () => {
  const { user, logout, isAdmin } = useAuth();
  const { currentProject } = useProject();
  const { theme, toggleTheme, isDark } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { id: routeProjectId } = useParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Determine if currently inside a specific project workspace
  const activeProjectId = routeProjectId || (location.pathname.startsWith('/projects/') ? location.pathname.split('/')[2] : null);
  const isInsideProject = Boolean(activeProjectId && activeProjectId !== 'new');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/projects?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const mainNavItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'My Tasks', path: '/my-tasks', icon: CheckSquare },
    { label: 'Projects', path: '/projects', icon: FolderKanban },
    { label: 'Calendar', path: '/calendar', icon: Calendar },
    { label: 'Notifications', path: '/notifications', icon: Bell },
    { label: 'Profile', path: '/profile', icon: User },
  ];

  const projectNavItems = isInsideProject
    ? [
        { label: 'Overview', path: `/projects/${activeProjectId}`, icon: Layers, exact: true },
        { label: 'Kanban Board', path: `/projects/${activeProjectId}/board`, icon: FolderKanban },
        { label: 'Tasks List', path: `/projects/${activeProjectId}/tasks`, icon: CheckSquare },
        { label: 'Team', path: `/projects/${activeProjectId}/team`, icon: Users },
        { label: 'Chat', path: `/projects/${activeProjectId}/chat`, icon: MessageSquare },
        { label: 'Files', path: `/projects/${activeProjectId}/files`, icon: FileText },
        { label: 'Calendar', path: `/projects/${activeProjectId}/calendar`, icon: Calendar },
        { label: 'Activity', path: `/projects/${activeProjectId}/activity`, icon: Activity },
        { label: 'Analytics', path: `/projects/${activeProjectId}/analytics`, icon: BarChart3 },
        { label: 'Settings', path: `/projects/${activeProjectId}/settings`, icon: Settings },
      ]
    : [];

  const isActive = (item) => {
    if (item.exact) {
      return location.pathname === item.path;
    }
    return location.pathname.startsWith(item.path);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Mobile Menu Toggle */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <Link to="/dashboard" className="flex items-center space-x-2.5">
              <AppLogo size="w-9 h-9" />
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
                TaskFlow
              </span>
            </Link>
          </div>

          {/* Global Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex items-center relative max-w-md w-full mx-6"
          >
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search projects, tasks, or members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-1.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </form>

          {/* Right Actions */}
          <div className="flex items-center space-x-3">
            <Link
              to="/projects/new"
              className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Project</span>
            </Link>

            <NotificationDropdown />

            {isAdmin && (
              <Link
                to="/admin"
                className="hidden sm:flex items-center space-x-1 px-2.5 py-1.5 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 rounded-lg text-xs font-semibold transition-colors"
                title="System Administration"
              >
                <Shield className="w-4 h-4" />
                <span>Admin</span>
              </Link>
            )}

            {/* User Profile Mini Menu */}
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
              <Link to="/profile" className="flex items-center space-x-2 group">
                <img
                  src={
                    user?.avatar ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                      user?.name || 'User'
                    )}`
                  }
                  alt={user?.name}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/30 group-hover:ring-indigo-400"
                />
                <span className="hidden xl:inline text-xs font-medium text-slate-300 group-hover:text-white">
                  {user?.name}
                </span>
              </Link>
              <button
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar for Desktop & Mobile drawer */}
        <aside
          className={`${
            mobileMenuOpen ? 'block' : 'hidden'
          } lg:block w-64 bg-slate-900/60 border-r border-slate-800/80 p-4 shrink-0 overflow-y-auto`}
        >
          {/* Main Navigation */}
          <div className="mb-6">
            <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Workspace
            </p>
            <nav className="space-y-1">
              {mainNavItems.map((item) => {
                const active = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      active
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Project Specific Navigation (Shown when active project is selected) */}
          {isInsideProject && (
            <div className="pt-4 border-t border-slate-800/80">
              <div className="px-3 mb-2 flex items-center justify-between">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
                  {currentProject?.name || 'Project Workspace'}
                </p>
              </div>
              <nav className="space-y-1">
                {projectNavItems.map((item) => {
                  const active = isActive(item);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                        active
                          ? 'bg-slate-800 text-indigo-400 border-l-2 border-indigo-500'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}

          {isAdmin && (
            <div className="pt-4 mt-6 border-t border-slate-800/80">
              <Link
                to="/admin"
                className="flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium text-purple-300 hover:bg-purple-950/40 transition-colors"
              >
                <Shield className="w-4 h-4" />
                <span>Admin Console</span>
              </Link>
            </div>
          )}
        </aside>

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Floating Socket Notification Toast */}
      <ToastNotification />
    </div>
  );
};

export default DashboardLayout;
