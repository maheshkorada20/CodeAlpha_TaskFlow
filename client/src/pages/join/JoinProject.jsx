import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import invitationService from '../../services/invitationService';
import { useAuth } from '../../context/AuthContext';
import {
  Sparkles,
  Key,
  Users,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  LogIn,
  UserPlus,
  Search,
  Check,
  FolderKanban,
  ExternalLink,
  Layers,
  Calendar,
  Clock
} from 'lucide-react';

export const JoinProject = () => {
  const { token: urlToken } = useParams();
  const [searchParams] = useSearchParams();
  const queryCode = searchParams.get('code');
  const initialCode = urlToken || queryCode || '';

  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [inputCode, setInputCode] = useState(initialCode);
  const [activeToken, setActiveToken] = useState(initialCode);
  const [invitation, setInvitation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState(null);
  const [alreadyMember, setAlreadyMember] = useState(false);
  const [existingProjectId, setExistingProjectId] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Helper to sanitize code/tokens (handle pasted URLs, hyphens, spaces)
  const sanitizeInput = (val) => {
    if (!val) return '';
    const trimmed = String(val).trim();
    // If user pasted a full URL like http://.../join/8FJ29KX9P2 or ?code=8FJ29KX9P2
    if (trimmed.includes('join/')) {
      const parts = trimmed.split('join/');
      return parts[parts.length - 1].split('?')[0].replace(/[-\s]/g, '').toUpperCase();
    }
    if (trimmed.includes('code=')) {
      const match = trimmed.match(/code=([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        return match[1].replace(/[-\s]/g, '').toUpperCase();
      }
    }
    return trimmed.replace(/[-\s]/g, '').toUpperCase();
  };

  // Verify invitation by token
  const verifyToken = async (codeToVerify) => {
    const clean = sanitizeInput(codeToVerify);
    if (!clean) {
      setError('Please enter a valid Project Code or Invitation Link');
      return;
    }

    setIsLoading(true);
    setError(null);
    setAlreadyMember(false);
    setHasSearched(true);
    setActiveToken(clean);

    try {
      const res = await invitationService.getInvitationByToken(clean);
      const inv = res?.data?.invitation || res?.invitation || res?.data;
      if (inv) {
        setInvitation(inv);
      } else {
        setError('Project not found. Please double check the Project Code.');
        setInvitation(null);
      }
    } catch (err) {
      setInvitation(null);
      setError(err.message || 'Invalid or expired Project Code. Please verify with your Team Leader.');
    } finally {
      setIsLoading(false);
    }
  };

  // If token is provided in the URL or query params on initial mount, auto-verify
  useEffect(() => {
    if (initialCode) {
      setInputCode(initialCode);
      verifyToken(initialCode);
    }
  }, [initialCode]);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    if (!inputCode.trim()) {
      setError('Please enter a Project Code');
      return;
    }
    verifyToken(inputCode);
  };

  const handleJoin = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/join/${activeToken}` } });
      return;
    }

    setIsJoining(true);
    setError(null);
    try {
      const res = await invitationService.joinProject(activeToken);
      const projectId = res?.data?.projectId || res?.projectId || invitation?.project?._id || invitation?.project;
      if (projectId) {
        navigate(`/projects/${projectId}`);
      } else {
        navigate('/projects');
      }
    } catch (err) {
      const errMsg = err.message || '';
      if (errMsg.toLowerCase().includes('already a member')) {
        setAlreadyMember(true);
        const pId = err.data?.projectId || invitation?.project?._id || invitation?.project;
        if (pId) {
          setExistingProjectId(pId);
        }
      } else {
        setError(errMsg || 'Failed to join project. Please try again.');
      }
    } finally {
      setIsJoining(false);
    }
  };

  const project = invitation?.project;
  const createdBy = invitation?.createdBy;
  const targetProjectId = existingProjectId || project?._id;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 bg-gradient-to-b from-indigo-600/10 via-violet-600/5 to-transparent blur-3xl pointer-events-none" />

      {/* Top Header / Branding */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <FolderKanban className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              TaskFlow
            </span>
          </Link>

          <div className="flex items-center space-x-3 text-xs">
            {isAuthenticated ? (
              <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-300 font-medium">{user?.name}</span>
                <Link to="/dashboard" className="text-indigo-400 hover:text-indigo-300 font-semibold ml-2">
                  Dashboard →
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  state={{ from: activeToken ? `/join/${activeToken}` : '/join' }}
                  className="px-3.5 py-1.5 text-slate-300 hover:text-white font-medium rounded-lg hover:bg-slate-900 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  state={{ from: activeToken ? `/join/${activeToken}` : '/join' }}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-sm transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Google Meet-style Join Container */}
      <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto px-4 py-12 flex flex-col justify-center">
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Google Meet-Style Workspace Joiner</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Ready to collaborate with your team?
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Enter the Project Code or Invitation Link provided by your Team Leader to access tasks, team chat, and files.
          </p>
        </div>

        {/* Google Meet Input Bar */}
        <div className="max-w-xl w-full mx-auto mb-8">
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-col sm:flex-row items-center gap-2 p-2 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-xl focus-within:border-indigo-500/60 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all"
          >
            <div className="flex items-center space-x-3 px-3 w-full sm:flex-1">
              <Key className="w-5 h-5 text-indigo-400 flex-shrink-0" />
              <input
                type="text"
                value={inputCode}
                onChange={(e) => {
                  setInputCode(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Enter Project Code (e.g. 8FJ29KX9P2)"
                className="w-full bg-transparent py-2.5 text-sm sm:text-base font-medium text-white placeholder-slate-500 focus:outline-none tracking-wide"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !inputCode.trim()}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all flex-shrink-0"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Verify Code</span>
                </>
              )}
            </button>
          </form>

          {/* Quick instructions / tips */}
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 px-2">
            <span>💡 You can paste either the 10-digit code or the full invitation link</span>
            {activeToken && (
              <span className="font-mono text-indigo-400/80">Code: {sanitizeInput(activeToken)}</span>
            )}
          </div>
        </div>

        {/* Error Notification */}
        {error && !alreadyMember && (
          <div className="max-w-xl w-full mx-auto mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-3 animate-fade-in shadow-lg">
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-rose-200">Unable to locate project</p>
              <p className="mt-0.5 text-rose-300/90 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* Project Found Preview Card */}
        {invitation && (
          <div className="max-w-xl w-full mx-auto glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden animate-fade-in space-y-6">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

            {/* Header / Project Identity */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] uppercase font-bold tracking-wider px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                  Project Verified
                </span>
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Active Code
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
                {project?.name}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {project?.description || 'Collaborative team workspace on TaskFlow.'}
              </p>
            </div>

            {/* Key Objective if specified */}
            {project?.objective && (
              <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800 text-xs">
                <span className="font-bold text-indigo-400 block mb-1">Key Objective:</span>
                <p className="text-slate-200 leading-relaxed">{project.objective}</p>
              </div>
            )}

            {/* Team Leader & Role Profile */}
            <div className="flex items-center justify-between p-3.5 bg-slate-900/60 rounded-2xl border border-slate-800/80">
              <div className="flex items-center space-x-3 min-w-0">
                <img
                  src={
                    createdBy?.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      createdBy?.name || 'Leader'
                    )}&background=6366f1&color=fff`
                  }
                  alt={createdBy?.name || 'Lead'}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/40 flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-[11px] text-slate-400 font-medium">Project Leader</p>
                  <p className="text-xs font-bold text-white truncate">{createdBy?.name || 'Team Lead'}</p>
                </div>
              </div>
              <span className="text-[11px] font-semibold px-3 py-1 bg-indigo-950 text-indigo-300 rounded-lg border border-indigo-800/50 flex-shrink-0">
                Your Role: Team Member
              </span>
            </div>

            {/* Join Actions */}
            {alreadyMember ? (
              <div className="text-center pt-2 space-y-3">
                <div className="inline-flex items-center space-x-2 text-emerald-400 text-xs font-bold bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>You are already a member of this project!</span>
                </div>
                <Link
                  to={targetProjectId ? `/projects/${targetProjectId}` : '/projects'}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all"
                >
                  <span>Open Project Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : isAuthenticated ? (
              /* User is logged in -> Join Project Button */
              <div className="space-y-4 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Joining as: <strong className="text-slate-100">{user?.name}</strong></span>
                  <span className="text-[11px] text-slate-500">({user?.email})</span>
                </div>

                <button
                  onClick={handleJoin}
                  disabled={isJoining}
                  className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl text-xs sm:text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all transform active:scale-98"
                >
                  {isJoining ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Join Project Workspace</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* User is not logged in -> Sign in / Sign up options preserving code */
              <div className="space-y-4 pt-2 border-t border-slate-800">
                <p className="text-xs text-slate-400 text-center">
                  Please log in or create an account to accept this project invitation:
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to="/login"
                    state={{ from: `/join/${activeToken}` }}
                    className="py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs text-center shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center space-x-1.5"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Log In to Join</span>
                  </Link>

                  <Link
                    to="/register"
                    state={{ from: `/join/${activeToken}` }}
                    className="py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold rounded-xl text-xs text-center transition-all flex items-center justify-center space-x-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Sign Up to Join</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/60 py-6 px-4 text-center text-xs text-slate-500">
        TaskFlow Collaborative Project Management & Team Workspace
      </footer>
    </div>
  );
};

export default JoinProject;
