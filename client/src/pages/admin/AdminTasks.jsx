import React, { useState, useEffect } from 'react';
import { CheckSquare, Search, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { adminService } from '../../services/adminService';
import { Link } from 'react-router-dom';

export const AdminTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      const res = await adminService.getTasks();
      setTasks(res.data.data.tasks || []);
    } catch (err) {
      console.error('Failed to load admin tasks', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = tasks.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    (t.project?.name && t.project.name.toLowerCase().includes(search.toLowerCase())) ||
    (t.assignedTo?.name && t.assignedTo.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-indigo-400" />
            System Task Catalog
          </h1>
          <p className="text-xs text-slate-400">All work items across platform projects</p>
        </div>

        <input
          type="text"
          placeholder="Filter by title, project, or member..."
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
                <th className="py-3.5 px-5">Task Title</th>
                <th className="py-3.5 px-5">Project</th>
                <th className="py-3.5 px-5">Assignee</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5">Priority</th>
                <th className="py-3.5 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filtered.map(t => (
                <tr key={t._id} className="hover:bg-slate-850/40">
                  <td className="py-3.5 px-5 font-semibold text-slate-200">{t.title}</td>
                  <td className="py-3.5 px-5 text-indigo-400">{t.project?.name || 'Project'}</td>
                  <td className="py-3.5 px-5 text-slate-300">{t.assignedTo?.name || 'Unassigned'}</td>
                  <td className="py-3.5 px-5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300">
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {t.priority}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <Link
                      to={`/tasks/${t._id}`}
                      className="text-indigo-400 hover:text-indigo-300 font-medium"
                    >
                      View
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

export default AdminTasks;
