import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  FolderKanban, 
  Calendar, 
  Users, 
  CheckCircle2, 
  ArrowRight,
  Shield,
  Layers,
  Clock,
  AlertCircle
} from 'lucide-react';
import { format, isPast } from 'date-fns';
import { projectService } from '../../services/projectService';
import { useAuth } from '../../context/AuthContext';

export const ProjectList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') || '';

  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState(urlSearch);
  const [filterStatus, setFilterStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (urlSearch) {
      setSearch(urlSearch);
    }
  }, [urlSearch]);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const res = await projectService.getProjects();
      const list = res?.data?.projects || res?.projects || (Array.isArray(res?.data) ? res.data : []);
      setProjects(list);
    } catch (err) {
      setError(err.message || 'Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = !search || 
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = !filterStatus || p.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <FolderKanban className="w-7 h-7 text-indigo-500" />
            Projects Workspace
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Access your collaborative team workspaces, active roadmaps, and delivery milestones.
          </p>
        </div>

        <Link
          to="/projects/new"
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" /> Create Project
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search projects by title or objective..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PLANNING">Planning</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="COMPLETED">Completed</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Projects Grid */}
      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-xs">Retrieving your projects...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-16 text-center space-y-4">
          <FolderKanban className="w-12 h-12 stroke-1 text-slate-600 mx-auto" />
          <div>
            <h3 className="text-base font-bold text-slate-200">No projects found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {search || filterStatus
                ? 'Try adjusting your search filters or status criteria.'
                : 'Create your first project or ask a project lead for an invitation link to collaborate.'}
            </p>
          </div>
          <Link
            to="/projects/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" /> Launch Project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map(proj => {
            const isOwner = proj.owner?._id === user?._id || proj.owner === user?._id;
            const isOverdue = proj.dueDate && isPast(new Date(proj.dueDate)) && proj.status !== 'COMPLETED';
            const progress = proj.progress || 0;

            return (
              <div
                key={proj._id}
                onClick={() => navigate(`/projects/${proj._id}`)}
                className="bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between group shadow-sm hover:shadow-md"
              >
                <div>
                  {/* Status & Priority */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${
                      proj.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}>
                      {proj.status}
                    </span>

                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      {proj.priority} Priority
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors mb-2 line-clamp-1">
                    {proj.name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                    {proj.description || 'Collaborative workspace for tasks, files, and discussion.'}
                  </p>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center text-[11px] mb-1">
                      <span className="text-slate-400 font-medium">Progress</span>
                      <span className="text-indigo-400 font-bold">{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Info: Lead, Deadline, Members */}
                <div className="pt-3 border-t border-slate-800/80 text-xs flex items-center justify-between text-slate-400">
                  <div className="flex items-center space-x-2">
                    <img
                      src={proj.owner?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(proj.owner?.name || 'Owner')}&background=6366f1&color=fff`}
                      alt={proj.owner?.name}
                      className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-700"
                    />
                    <span className="text-[11px] text-slate-300 truncate max-w-[90px]">
                      {isOwner ? 'You (Owner)' : proj.owner?.name}
                    </span>
                  </div>

                  {proj.dueDate && (
                    <span className={`flex items-center gap-1 text-[11px] ${isOverdue ? 'text-rose-400 font-bold' : ''}`}>
                      <Calendar className="w-3 h-3" />
                      {format(new Date(proj.dueDate), 'MMM d')}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProjectList;
