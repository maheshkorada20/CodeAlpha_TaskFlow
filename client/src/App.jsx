import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProjectProvider } from './context/ProjectContext';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';

// Layouts
import MainLayout from './layouts/MainLayout';
import DashboardLayout from './layouts/DashboardLayout';
import AdminLayout from './layouts/AdminLayout';

// Route Guards
import { ProtectedRoute, AdminRoute } from './routes/ProtectedRoute';

// Public Pages
import Home from './pages/public/Home';
import About from './pages/public/About';
import Contact from './pages/public/Contact';
import Faq from './pages/public/Faq';
import NotFound from './pages/public/NotFound';
import Unauthorized from './pages/public/Unauthorized';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Invitation Flow
import JoinProject from './pages/join/JoinProject';

// User Dashboard Pages
import Dashboard from './pages/dashboard/Dashboard';
import MyTasks from './pages/dashboard/MyTasks';
import Profile from './pages/dashboard/Profile';

// Project Pages
import ProjectList from './pages/projects/ProjectList';
import NewProject from './pages/projects/NewProject';
import ProjectWorkspace from './pages/projects/ProjectWorkspace';

// Task & Schedule Pages
import TaskDetailPage from './pages/tasks/TaskDetailPage';
import GlobalCalendar from './pages/calendar/GlobalCalendar';
import Notifications from './pages/notifications/Notifications';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <NotificationProvider>
              <ProjectProvider>
                <Routes>
                {/* Public Website Routes */}
                <Route element={<MainLayout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/faq" element={<Faq />} />
                </Route>

                {/* Authentication Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Public / Semi-public Project Invitation Route (Google Meet style) */}
                <Route path="/join" element={<JoinProject />} />
                <Route path="/join/:token" element={<JoinProject />} />

                {/* Protected User Workspace Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<DashboardLayout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/my-tasks" element={<MyTasks />} />
                    <Route path="/projects" element={<ProjectList />} />
                    <Route path="/projects/new" element={<NewProject />} />
                    <Route path="/projects/:id" element={<ProjectWorkspace />} />
                    <Route path="/projects/:id/*" element={<ProjectWorkspace />} />
                    <Route path="/tasks/:id" element={<TaskDetailPage />} />
                    <Route path="/calendar" element={<GlobalCalendar />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/settings" element={<Profile />} />
                  </Route>
                </Route>

                {/* Protected Admin Routes */}
                <Route element={<AdminRoute />}>
                  <Route element={<AdminLayout />}>
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/users" element={<AdminUsers />} />
                    <Route path="/admin/*" element={<Navigate to="/admin" replace />} />
                  </Route>
                </Route>

                {/* Error & Fallback Routes */}
                <Route path="/unauthorized" element={<Unauthorized />} />
                <Route path="*" element={<NotFound />} />
                </Routes>
              </ProjectProvider>
            </NotificationProvider>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
