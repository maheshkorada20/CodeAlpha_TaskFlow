import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Layers, 
  FolderKanban, 
  CheckSquare, 
  Users, 
  MessageSquare, 
  FileText, 
  Calendar, 
  Activity, 
  BarChart3, 
  Settings,
  AlertCircle
} from 'lucide-react';
import { projectService } from '../../services/projectService';
import { taskService } from '../../services/taskService';
import { memberService } from '../../services/memberService';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useProject } from '../../context/ProjectContext';

import ProjectOverview from '../../components/projects/ProjectOverview';
import KanbanBoard from '../../components/board/KanbanBoard';
import TaskList from '../../components/tasks/TaskList';
import TeamWorkspace from '../../components/team/TeamWorkspace';
import ProjectChat from '../../components/chat/ProjectChat';
import FileManager from '../../components/files/FileManager';
import ProjectCalendar from '../../components/calendar/ProjectCalendar';
import ProjectActivity from '../../components/activity/ProjectActivity';
import ProjectAnalytics from '../../components/analytics/ProjectAnalytics';
import ProjectSettings from '../../components/projects/ProjectSettings';
import TaskModal from '../../components/tasks/TaskModal';
import TaskDetailModal from '../../components/tasks/TaskDetailModal';

export const ProjectWorkspace = () => {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { socket, joinProject, leaveProject } = useSocket();
  const { updateProjectState } = useProject();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [stats, setStats] = useState({});
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [detailTaskId, setDetailTaskId] = useState(null);
  const [initialTaskStatus, setInitialTaskStatus] = useState('TODO');

  // Derive active tab from pathname
  const pathParts = location.pathname.split('/');
  const subTab = pathParts[3] || 'overview';

  useEffect(() => {
    if (projectId) {
      loadProjectData();
      if (joinProject) {
        joinProject(projectId);
      }
    }

    return () => {
      if (projectId && leaveProject) {
        leaveProject(projectId);
      }
    };
  }, [projectId]);

  // Real-time socket event handling
  useEffect(() => {
    if (!socket || !projectId) return;

    const handleTaskCreated = (data) => {
      const task = data?.task || data;
      if (task) {
        setTasks(prev => [task, ...prev]);
        loadProjectOverview();
      }
    };

    const handleTaskUpdated = (data) => {
      const task = data?.task || data;
      if (task) {
        setTasks(prev => prev.map(t => t._id === task._id ? task : t));
        loadProjectOverview();
      }
    };

    const handleTaskDeleted = ({ taskId }) => {
      setTasks(prev => prev.filter(t => t._id !== taskId));
      loadProjectOverview();
    };

    const handleTaskStatusChanged = ({ taskId, status }) => {
      setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status } : t));
      loadProjectOverview();
    };

    const handleMemberJoined = (data) => {
      const member = data?.member;
      const joinedUser = data?.user;
      if (member) {
        setMembers(prev => [...prev, member]);
      } else if (joinedUser) {
        setMembers(prev => [...prev, { user: joinedUser, role: 'Member', joinedAt: new Date() }]);
      }
      loadProjectOverview();
    };

    const handleMemberRemoved = ({ userId }) => {
      setMembers(prev => prev.filter(m => (m.user?._id || m.user) !== userId));
      loadProjectOverview();
    };

    const handleMemberRoleUpdated = ({ userId, role }) => {
      setMembers(prev => prev.map(m => (m.user?._id || m.user) === userId ? { ...m, role } : m));
    };

    const handleProjectUpdated = (data) => {
      const updatedProject = data?.project || data;
      if (updatedProject) {
        setProject(updatedProject);
        updateProjectState(updatedProject);
      }
    };

    socket.on('task:created', handleTaskCreated);
    socket.on('task:updated', handleTaskUpdated);
    socket.on('task:deleted', handleTaskDeleted);
    socket.on('task:status_changed', handleTaskStatusChanged);
    socket.on('member:joined', handleMemberJoined);
    socket.on('member:removed', handleMemberRemoved);
    socket.on('member:role_updated', handleMemberRoleUpdated);
    socket.on('project:updated', handleProjectUpdated);

    return () => {
      socket.off('task:created', handleTaskCreated);
      socket.off('task:updated', handleTaskUpdated);
      socket.off('task:deleted', handleTaskDeleted);
      socket.off('task:status_changed', handleTaskStatusChanged);
      socket.off('member:joined', handleMemberJoined);
      socket.off('member:removed', handleMemberRemoved);
      socket.off('member:role_updated', handleMemberRoleUpdated);
      socket.off('project:updated', handleProjectUpdated);
    };
  }, [socket, projectId]);

  const loadProjectData = async () => {
    try {
      setIsLoading(true);
      setError('');
      await Promise.all([
        loadProjectOverview(),
        loadTasks(),
        loadMembers(),
        loadActivities(),
      ]);
    } catch (err) {
      setError(err.message || 'Failed to load project workspace');
    } finally {
      setIsLoading(false);
    }
  };

  const loadProjectOverview = async () => {
    try {
      const res = await projectService.getProjectById(projectId);
      const proj = res?.data?.project || res?.project || res?.data;
      if (proj) {
        setProject(proj);
        updateProjectState(proj);
        // Backend embeds stats inside project.metrics — extract them here
        const metrics = proj.metrics || {};
        setStats({
          totalTasks: metrics.totalTasks || 0,
          completedTasks: metrics.completedTasks || 0,
          inProgressTasks: metrics.inProgressTasks || 0,
          inReviewTasks: metrics.inReviewTasks || 0,
          todoTasks: metrics.todoTasks || 0,
          overdueTasks: metrics.overdueTasks || 0,
          membersCount: metrics.membersCount || 0,
          progress: metrics.progress || 0,
        });
      }
    } catch (err) {
      console.error('Failed to load project details', err);
    }
  };

  const loadTasks = async () => {
    try {
      const res = await taskService.getTasks(projectId);
      const taskList = res?.data?.tasks || res?.tasks || (Array.isArray(res?.data) ? res.data : []);
      setTasks(taskList);
    } catch (err) {
      console.error('Failed to load project tasks', err);
    }
  };

  const loadMembers = async () => {
    try {
      const res = await memberService.getMembers(projectId);
      const memberList = res?.data?.members || res?.members || (Array.isArray(res?.data) ? res.data : []);
      setMembers(memberList);
    } catch (err) {
      console.error('Failed to load project members', err);
    }
  };

  const loadActivities = async () => {
    try {
      const res = await projectService.getProjectActivity(projectId);
      const activityList = res?.data?.activities || res?.activities || (Array.isArray(res?.data) ? res.data : []);
      setActivities(activityList);
    } catch (err) {
      console.error('Failed to load activities', err);
    }
  };

  // Robust Permissions calculation
  const userId = user?._id || user?.id;
  const ownerId = project?.owner?._id || project?.owner?.id || (typeof project?.owner === 'string' ? project?.owner : null);
  const isOwner = Boolean(
    (ownerId && userId && ownerId.toString() === userId.toString()) ||
    project?.userRole === 'owner' ||
    project?.userRole === 'admin'
  );
  const myMemberRecord = members.find(m => {
    const mUserId = m?.user?._id || m?.user?.id || (typeof m?.user === 'string' ? m?.user : null);
    return mUserId && userId && mUserId.toString() === userId.toString();
  });
  const memberRole = (myMemberRecord?.role || project?.userRole || '').toLowerCase();
  const isManager = memberRole === 'manager' || memberRole === 'lead';
  const isManagerOrOwner = isOwner || isManager || memberRole === 'owner' || user?.globalRole === 'admin';

  // Compute real-time stats directly from loaded tasks state with server stats fallback
  const activeTasks = tasks || [];
  const derivedStats = {
    totalTasks: activeTasks.length > 0 ? activeTasks.length : (stats?.totalTasks || 0),
    completedTasks: activeTasks.length > 0 
      ? activeTasks.filter(t => t.status === 'DONE').length 
      : (stats?.completedTasks || 0),
    inProgressTasks: activeTasks.length > 0 
      ? activeTasks.filter(t => t.status === 'IN_PROGRESS').length 
      : (stats?.inProgressTasks || 0),
    inReviewTasks: activeTasks.length > 0 
      ? activeTasks.filter(t => t.status === 'IN_REVIEW').length 
      : (stats?.inReviewTasks || 0),
    todoTasks: activeTasks.length > 0 
      ? activeTasks.filter(t => t.status === 'TODO').length 
      : (stats?.todoTasks || 0),
    overdueTasks: activeTasks.length > 0
      ? activeTasks.filter(t => t.status !== 'DONE' && t.dueDate && new Date(t.dueDate) < new Date()).length
      : (stats?.overdueTasks || 0),
    membersCount: members.length > 0 ? members.length : (stats?.membersCount || 0),
    progress: activeTasks.length > 0
      ? Math.round((activeTasks.filter(t => t.status === 'DONE').length / activeTasks.length) * 100)
      : (stats?.progress || 0),
  };

  // Workspace subtab navigation
  const handleTabChange = (tabKey) => {
    if (tabKey === 'overview') {
      navigate(`/projects/${projectId}`);
    } else {
      navigate(`/projects/${projectId}/${tabKey}`);
    }
  };

  // Task actions
  const handleOpenNewTask = (status = 'TODO') => {
    setInitialTaskStatus(status);
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const handleTaskSubmit = async (formData) => {
    if (editingTask) {
      await taskService.updateTask(editingTask._id, formData);
    } else {
      await taskService.createTask(projectId, { ...formData, status: initialTaskStatus });
    }
    loadTasks();
    loadProjectOverview();
  };

  const handleTaskStatusChange = async (taskId, newStatus) => {
    setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
    try {
      await taskService.updateStatus(taskId, newStatus);
      loadProjectOverview();
    } catch (err) {
      loadTasks();
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await taskService.deleteTask(taskId);
      setTasks(prev => prev.filter(t => t._id !== taskId));
      loadProjectOverview();
    } catch (err) {
      alert(err.message || 'Failed to delete task');
    }
  };

  const handleCardClick = (task) => {
    setDetailTaskId(task._id);
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-xs">Entering project workspace...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center max-w-lg mx-auto space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Project Not Accessible</h2>
        <p className="text-xs text-slate-400">{error || 'This project does not exist or you do not have permission to view it.'}</p>
        <button
          onClick={() => navigate('/projects')}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
        >
          Return to Projects
        </button>
      </div>
    );
  }

  const tabs = [
    { key: 'overview', label: 'Overview', icon: Layers },
    { key: 'board', label: 'Kanban Board', icon: FolderKanban },
    { key: 'tasks', label: 'Tasks', icon: CheckSquare },
    { key: 'team', label: 'Team', icon: Users },
    { key: 'chat', label: 'Chat', icon: MessageSquare },
    { key: 'files', label: 'Files', icon: FileText },
    { key: 'calendar', label: 'Calendar', icon: Calendar },
    { key: 'activity', label: 'Activity', icon: Activity },
    { key: 'analytics', label: 'Analytics', icon: BarChart3 },
    { key: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="space-y-6">
      {/* Workspace Header Tabs Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-2 flex items-center overflow-x-auto gap-1">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = (subTab === tab.key) || (subTab === 'overview' && tab.key === 'overview');

          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Subtab Content View */}
      {subTab === 'overview' && (
        <ProjectOverview
          project={project}
          stats={derivedStats}
          tasks={tasks}
          members={members}
          activities={activities}
          onNavigateTab={handleTabChange}
          onNewTaskClick={handleOpenNewTask}
          onTaskClick={handleCardClick}
          isManagerOrOwner={isManagerOrOwner}
        />
      )}

      {subTab === 'board' && (
        <KanbanBoard
          tasks={tasks}
          projectId={projectId}
          members={members}
          onTaskClick={handleCardClick}
          onNewTaskClick={handleOpenNewTask}
          onTaskStatusChange={handleTaskStatusChange}
          isManagerOrOwner={isManagerOrOwner}
          currentUserId={user?._id}
        />
      )}

      {subTab === 'tasks' && (
        <TaskList
          tasks={tasks}
          members={members}
          onTaskClick={handleCardClick}
          onNewTaskClick={handleOpenNewTask}
          onDeleteTask={handleDeleteTask}
          isManagerOrOwner={isManagerOrOwner}
        />
      )}

      {subTab === 'team' && (
        <TeamWorkspace
          projectId={projectId}
          project={project}
          members={members}
          onMembersUpdated={loadMembers}
          isOwner={isOwner}
          isManager={isManager}
        />
      )}

      {subTab === 'chat' && (
        <ProjectChat
          projectId={projectId}
          isManagerOrOwner={isManagerOrOwner}
        />
      )}

      {subTab === 'files' && (
        <FileManager
          projectId={projectId}
          isManagerOrOwner={isManagerOrOwner}
        />
      )}

      {subTab === 'calendar' && (
        <ProjectCalendar
          tasks={tasks}
          members={members}
          onTaskClick={handleCardClick}
        />
      )}

      {subTab === 'activity' && (
        <ProjectActivity projectId={projectId} />
      )}

      {subTab === 'analytics' && (
        <ProjectAnalytics projectId={projectId} />
      )}

      {subTab === 'settings' && (
        <ProjectSettings
          project={project}
          onProjectUpdated={(p) => {
            setProject(p);
            setCurrentProject(p);
          }}
          isOwner={isOwner}
        />
      )}

      {/* Create / Edit Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSubmit={handleTaskSubmit}
        task={editingTask}
        members={members}
      />

      {/* Task Details / Full Workflow Modal */}
      <TaskDetailModal
        taskId={detailTaskId}
        isOpen={Boolean(detailTaskId)}
        onClose={() => setDetailTaskId(null)}
        onTaskUpdated={() => {
          loadTasks();
          loadProjectOverview();
        }}
        isManagerOrOwner={isManagerOrOwner}
        projectMembers={members}
      />
    </div>
  );
};

export default ProjectWorkspace;
