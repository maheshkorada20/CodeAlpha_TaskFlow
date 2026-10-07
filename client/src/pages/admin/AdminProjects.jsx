import React, { useState, useEffect } from 'react';
import { FolderKanban, Search, Calendar, Users, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { adminService } from '../../services/adminService';
import { Link } from 'react-router-dom';

export const AdminProjects = () => {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const res = await adminService.getProjects();
      setProjects(res.data.data.projects || []);
    } catch (err) {
      console.error('Failed to load admin projects', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.owner?.name && p.owner.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-indigo-400" />
            System Projects Supervision
          </h1>
          <p className="text-xs text-slate-400">All collaborative workspaces running on TaskFlow</p>
        </div>

        <input
          type="text"
          placeholder="Filter by title or owner..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500 w-full sm:w-64"
        />
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-850/60 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-5">Project Name</th>
                <th className="py-3.5 px-5">Owner</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5">Created</th>
                <th className="py-3.5 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filtered.map(p => (
                <tr key={p._id} className="hover:bg-slate-850/40">
                  <td className="py-3.5 px-5 font-semibold text-slate-200">{p.name}</td>
                  <td className="py-3.5 px-5 text-slate-300">{p.owner?.name || 'Owner'}</td>
                  <td className="py-3.5 px-5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-slate-400">
                    {p.createdAt ? format(new Date(p.createdAt), 'MMM d, yyyy') : ''}
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <Link
                      to={`/projects/${p._id}`}
                      className="text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1"
                    >
                      Inspect <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminProjects;
