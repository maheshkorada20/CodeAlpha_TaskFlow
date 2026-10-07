import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Image as ImageIcon, 
  Upload, 
  Download, 
  Trash2, 
  ExternalLink, 
  Filter, 
  Search,
  HardDrive,
  File
} from 'lucide-react';
import { format } from 'date-fns';
import { fileService } from '../../services/fileService';
import { useAuth } from '../../context/AuthContext';

export const FileManager = ({ projectId, isManagerOrOwner = false }) => {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [filterType, setFilterType] = useState('ALL'); // ALL, IMAGE, PDF, DOC
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (projectId) {
      loadFiles();
    }
  }, [projectId]);

  const loadFiles = async () => {
    try {
      setIsLoading(true);
      const res = await fileService.getProjectAttachments(projectId);
      setFiles(res.data.data.attachments || []);
    } catch (err) {
      console.error('Failed to load project files', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsUploading(true);
      await fileService.uploadProjectAttachment(projectId, file);
      loadFiles();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to upload file');
    } finally {
      setIsUploading(false);
      e.target.value = null;
    }
  };

  const handleDeleteFile = async (id) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    try {
      await fileService.deleteAttachment(id);
      setFiles(prev => prev.filter(f => f._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete file');
    }
  };

  const filteredFiles = files.filter(f => {
    const matchesSearch = search === '' || f.fileName.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (filterType === 'IMAGE') return f.fileType?.startsWith('image/');
    if (filterType === 'PDF') return f.fileType?.includes('pdf');
    if (filterType === 'DOC') return !f.fileType?.startsWith('image/') && !f.fileType?.includes('pdf');
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-indigo-400" />
            Project File Repository
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Documents, diagrams, wireframes, and specifications shared in this workspace.
          </p>
        </div>

        <label className="cursor-pointer px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-xs flex items-center gap-2 transition-colors shadow-lg shadow-indigo-600/20">
          <Upload className="w-4 h-4" />
          {isUploading ? 'Uploading...' : 'Upload New File'}
          <input
            type="file"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip"
          />
        </label>
      </div>

      {/* Filters and search */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/40 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center space-x-2">
          {['ALL', 'IMAGE', 'PDF', 'DOC'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                filterType === type
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {type === 'ALL' ? 'All Files' : type === 'IMAGE' ? 'Images' : type === 'PDF' ? 'PDFs' : 'Docs'}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by file name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* File Cards Grid */}
      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center space-y-2">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400">Loading files...</span>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
          <FileText className="w-12 h-12 stroke-1 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-400">No files found.</p>
          <p className="text-xs mt-1">Upload images, PDFs, or design assets to share with your team.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredFiles.map(file => {
            const isImage = file.fileType?.startsWith('image/');
            const isPdf = file.fileType?.includes('pdf');
            const canDelete = isManagerOrOwner || file.uploadedBy?._id === user?._id || file.uploadedBy === user?._id;

            return (
              <div
                key={file._id}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden p-4 flex flex-col justify-between transition-all group hover:shadow-md"
              >
                {/* Visual Preview */}
                <div className="h-32 rounded-xl bg-slate-800/80 flex items-center justify-center overflow-hidden mb-3 relative">
                  {isImage ? (
                    <img
                      src={file.fileUrl}
                      alt={file.fileName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : isPdf ? (
                    <div className="flex flex-col items-center text-rose-400">
                      <FileText className="w-10 h-10 mb-1" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">PDF Document</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-indigo-400">
                      <File className="w-10 h-10 mb-1" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Document</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="space-y-1 mb-3">
                  <h4 className="text-xs font-semibold text-slate-200 truncate" title={file.fileName}>
                    {file.fileName}
                  </h4>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{file.fileSize ? `${Math.round(file.fileSize / 1024)} KB` : 'File'}</span>
                    <span>{file.createdAt ? format(new Date(file.createdAt), 'MMM d, yyyy') : ''}</span>
                  </div>
                  {file.uploadedBy && (
                    <p className="text-[10px] text-slate-500 truncate">
                      Uploaded by {file.uploadedBy.name || 'Member'}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                  <a
                    href={file.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> View / Download
                  </a>

                  {canDelete && (
                    <button
                      onClick={() => handleDeleteFile(file._id)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Delete File"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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

export default FileManager;
