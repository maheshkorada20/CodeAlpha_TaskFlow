import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  Archive, 
  Trash2, 
  AlertTriangle, 
  Calendar,
  Layers,
  Flag,
  CheckCircle2
} from 'lucide-react';
import { projectService } from '../../services/projectService';
import { useNavigate } from 'react-router-dom';

export const ProjectSettings = ({ project, onProjectUpdated, isOwner = false }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    objective: '',
    status: 'ACTIVE',
    priority: 'HIGH',
    startDate: '',
    dueDate: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        description: project.description || '',
        objective: project.objective || '',
        status: project.status || 'ACTIVE',
        priority: project.priority || 'HIGH',
        startDate: project.startDate ? project.startDate.split('T')[0] : '',
        dueDate: project.dueDate ? project.dueDate.split('T')[0] : '',
      });
    }
  }, [project]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setErrorMsg('');
      setSuccessMsg('');
      const res = await projectService.updateProject(project._id, formData);
      setSuccessMsg('Project settings updated successfully!');
      if (onProjectUpdated) onProjectUpdated(res.data.data.project);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update project settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!window.confirm('Archive this project? Archived projects become read-only.')) return;
    try {
      setIsLoading(true);
      await projectService.archiveProject(project._id);
      alert('Project archived.');
      navigate('/projects');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to archive project');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Permanent deletion! Are you sure you want to permanently delete this project and all its tasks, files, and chat?')) {
      return;
    }
    try {
      setIsLoading(true);
      await projectService.deleteProject(project._id);
      alert('Project deleted successfully.');
      navigate('/projects');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete project');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-400" />
          Project Workspace Settings
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure project metadata, operational parameters, and lifecycle actions.
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Project Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Description
          </label>
          <textarea
            name="description"
            rows={3}
            value={formData.description}
            onChange={handleChange}
            className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
            Objective / Mission Target
          </label>
          <input
            type="text"
            name="objective"
            value={formData.objective}
            onChange={handleChange}
            className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="PLANNING">Planning</option>
              <option value="ACTIVE">Active</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="COMPLETED">Completed</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Priority Level
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Start Date
            </label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Project Deadline
            </label>
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-indigo-600/20"
          >
            <Save className="w-4 h-4" /> Save Project Changes
          </button>
        </div>
      </form>

      {/* Danger Zone (Owner only) */}
      {isOwner && (
        <div className="bg-slate-900/60 border border-rose-500/20 rounded-2xl p-6 space-y-4">
          <h4 className="text-sm font-bold text-rose-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Danger Zone
          </h4>
          <p className="text-xs text-slate-400">
            Careful: Archiving freezes workspace edits. Deleting permanently destroys tasks, files, and chat messages.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handleArchive}
              disabled={isLoading}
              className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Archive className="w-4 h-4" /> Archive Project
            </button>
            <button
              onClick={handleDelete}
              disabled={isLoading}
              className="px-4 py-2 bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Delete Project Permanently
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectSettings;
