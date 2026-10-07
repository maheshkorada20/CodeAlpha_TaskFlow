import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';
import {
  BarChart3,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Users,
  Target,
  ListTodo,
  Activity,
} from 'lucide-react';
import { analyticsService } from '../../services/analyticsService';

const STATUS_COLORS = {
  TODO: '#64748b',
  IN_PROGRESS: '#3b82f6',
  IN_REVIEW: '#f59e0b',
  DONE: '#10b981',
};

const PRIORITY_COLORS = {
  Low: '#10b981',
  Medium: '#6366f1',
  High: '#f59e0b',
  Urgent: '#ef4444',
};

const CustomTooltipStyle = {
  contentStyle: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
    borderRadius: '12px',
    fontSize: '12px',
  },
  itemStyle: { color: '#e2e8f0' },
  labelStyle: { color: '#94a3b8', fontWeight: 600 },
};

export const ProjectAnalytics = ({ projectId }) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (projectId) loadAnalytics();
  }, [projectId]);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      setError('');
      // API interceptor already unwraps response.data, so res IS the server's response body
      const res = await analyticsService.getProjectAnalytics(projectId);
      // Server returns: { success, data: { metrics, statusData, priorityData, memberWorkload, timelineData } }
      if (res?.success && res?.data) {
        setData(res.data);
      } else {
        setError('No analytics data returned from server.');
      }
    } catch (err) {
      console.error('Failed to load project analytics', err);
      setError(err?.message || 'Failed to load analytics.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Synthesizing project performance metrics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center">
        <BarChart3 className="w-12 h-12 stroke-1 mx-auto mb-3 text-slate-600" />
        <p className="text-sm font-medium text-slate-400 mb-1">
          {error || 'No analytics data available yet.'}
        </p>
        <p className="text-xs text-slate-500">Create and complete tasks to see metrics here.</p>
        <button
          onClick={loadAnalytics}
          className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // Server field names: metrics, statusData, priorityData, memberWorkload, timelineData
  const { metrics = {}, statusData = [], priorityData = [], memberWorkload = [], timelineData = [] } = data;

  const completionRate = metrics.totalTasks > 0
    ? Math.round(((metrics.doneTasks || 0) / metrics.totalTasks) * 100)
    : 0;

  // Map statusData for pie chart
  const statusPieData = statusData
    .filter(item => item.value > 0)
    .map(item => ({
      name: item.name || item.key,
      value: item.value,
      color: STATUS_COLORS[item.key] || '#6366f1',
    }));

  // Map priorityData for bar chart
  const priorityBarData = priorityData
    .filter(item => item.count > 0)
    .map(item => ({
      name: item.name,
      count: item.count,
      fill: PRIORITY_COLORS[item.name] || '#6366f1',
    }));

  // Map memberWorkload
  const workloadData = memberWorkload.map(item => ({
    name: item.name ? item.name.split(' ')[0] : 'Member',
    Total: item.total || 0,
    Completed: item.completed || 0,
    Active: item.active || 0,
  }));

  return (
    <div className="space-y-6">
      {/* Key Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-emerald-500/20 p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Completion</span>
            <Target className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">{completionRate}%</div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">{metrics.doneTasks || 0} of {metrics.totalTasks || 0} done</span>
        </div>

        <div className="bg-slate-900/60 border border-indigo-500/20 p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Tasks</span>
            <ListTodo className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white">{metrics.totalTasks || 0}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">{metrics.todoTasks || 0} to do · {metrics.unassignedTasks || 0} unassigned</span>
        </div>

        <div className="bg-slate-900/60 border border-blue-500/20 p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">In Progress</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400">{metrics.inProgressTasks || 0}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">{metrics.inReviewTasks || 0} under review</span>
        </div>

        <div className="bg-slate-900/60 border border-rose-500/20 p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Overdue</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400">{metrics.overdueTasks || 0}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Requires attention</span>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Donut Chart */}
        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
          <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" /> Tasks by Status
          </h4>
          <p className="text-xs text-slate-400 mb-4">Lifecycle phase distribution</p>
          <div className="h-64 w-full">
            {statusPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip {...CustomTooltipStyle} />
                  <Legend
                    iconType="circle"
                    iconSize={10}
                    wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2">
                <CheckCircle2 className="w-8 h-8 stroke-1" />
                <p className="text-xs">No tasks created yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Priority Bar Chart */}
        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
          <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" /> Tasks by Priority
          </h4>
          <p className="text-xs text-slate-400 mb-4">Urgency distribution across backlog</p>
          <div className="h-64 w-full">
            {priorityBarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityBarData} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                  <Tooltip {...CustomTooltipStyle} />
                  <Bar dataKey="count" name="Tasks" radius={[6, 6, 0, 0]}>
                    {priorityBarData.map((entry, index) => (
                      <Cell key={`cell-p-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2">
                <BarChart3 className="w-8 h-8 stroke-1" />
                <p className="text-xs">No priority data yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 7-Day Completion Timeline */}
      {timelineData.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
          <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" /> 7-Day Completion Timeline
          </h4>
          <p className="text-xs text-slate-400 mb-4">Tasks completed per day this week</p>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <Tooltip {...CustomTooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="completed"
                  name="Completed"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Team Workload */}
      <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" /> Team Workload Distribution
            </h4>
            <p className="text-xs text-slate-400">Task assignments per team member</p>
          </div>
          <span className="text-xs text-slate-500">{workloadData.length} members</span>
        </div>

        {workloadData.length > 0 ? (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workloadData} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <Tooltip {...CustomTooltipStyle} />
                <Legend
                  iconType="circle"
                  iconSize={10}
                  wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
                />
                <Bar dataKey="Total" name="Total Assigned" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Active" name="Active Tasks" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Completed" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex flex-col items-center justify-center text-slate-500 gap-2">
            <Users className="w-8 h-8 stroke-1" />
            <p className="text-xs">No member workload recorded yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectAnalytics;
