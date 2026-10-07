import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Copy, 
  Check, 
  RefreshCw, 
  Slash, 
  Trash2, 
  ShieldCheck, 
  ShieldAlert, 
  User, 
  Clock, 
  X,
  ExternalLink,
  AlertCircle,
  Share2,
  Key,
  Globe,
  Send,
  Sparkles
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { memberService } from '../../services/memberService';
import { invitationService } from '../../services/invitationService';
import { useAuth } from '../../context/AuthContext';

export const TeamWorkspace = ({
  projectId,
  project,
  members = [],
  onMembersUpdated,
  isOwner = false,
  isManager = false,
}) => {
  const { user } = useAuth();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteData, setInviteData] = useState(null);
  const [copiedType, setCopiedType] = useState(null); // 'link' | 'code' | 'msg' | 'top'
  const [isGenerating, setIsGenerating] = useState(false);
  const [maxUses, setMaxUses] = useState(25);
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [actionError, setActionError] = useState('');
  const [memberLoading, setMemberLoading] = useState(false);

  // Real URL configuration: Team Lead can override with their production URL or default to current origin
  const [customDomain, setCustomDomain] = useState(() => {
    return localStorage.getItem('taskflow_app_domain') || import.meta.env.VITE_APP_URL || window.location.origin;
  });
  const [isEditingDomain, setIsEditingDomain] = useState(false);

  const canManage = isOwner || isManager;

  const effectiveBaseUrl = (customDomain?.trim() || window.location.origin).replace(/\/$/, '');
  const joinUrl = inviteData?.token ? `${effectiveBaseUrl}/join/${inviteData.token}` : '';
  const shareMessage = `🚀 *TaskFlow Project Invitation*

You've been invited to collaborate on *${project?.name || 'our project'}*!

🔑 *Project Code:* ${inviteData?.token || ''}
🔗 *Join Link:* ${joinUrl}

👉 Open the link or visit TaskFlow, enter the Project Code, and join our team workspace!`;

  // Pre-load active invitation for this project
  useEffect(() => {
    if (projectId && canManage) {
      loadExistingInvite();
    }
  }, [projectId, canManage]);

  const loadExistingInvite = async () => {
    try {
      const res = await invitationService.getProjectInvitation(projectId);
      const inv = res?.data?.invitation || res?.invitation || res?.data;
      if (inv) {
        setInviteData(inv);
      }
    } catch (err) {
      console.log('No prior active invitation found, will generate on demand');
    }
  };

  const handleOpenInviteModal = async () => {
    setShowInviteModal(true);
    setActionError('');
    if (!inviteData || inviteData.status !== 'ACTIVE') {
      await handleGenerateInvite();
    }
  };

  const handleGenerateInvite = async () => {
    try {
      setIsGenerating(true);
      setActionError('');
      const res = await invitationService.createInvitation(projectId, {
        maxUses: Number(maxUses) || 25,
        expiresInDays: Number(expiresInDays) || 30,
      });
      const inv = res?.data?.invitation || res?.invitation || res?.data;
      setInviteData(inv);
    } catch (err) {
      setActionError(err.message || 'Failed to generate invitation link');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyCode = () => {
    if (!inviteData?.token) return;
    navigator.clipboard.writeText(inviteData.token);
    setCopiedType('code');
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleCopyLink = () => {
    if (!joinUrl) return;
    navigator.clipboard.writeText(joinUrl);
    setCopiedType('link');
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleCopyMessage = () => {
    if (!shareMessage) return;
    navigator.clipboard.writeText(shareMessage);
    setCopiedType('msg');
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleShareWhatsApp = () => {
    if (!shareMessage) return;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSaveDomain = (newDomain) => {
    const clean = newDomain.trim();
    setCustomDomain(clean || window.location.origin);
    if (clean) {
      localStorage.setItem('taskflow_app_domain', clean);
    } else {
      localStorage.removeItem('taskflow_app_domain');
    }
    setIsEditingDomain(false);
  };

  const handleDisableInvite = async () => {
    if (!inviteData?._id) return;
    try {
      setIsGenerating(true);
      const res = await invitationService.disableInvitation(inviteData._id);
      const inv = res?.data?.invitation || res?.invitation || res?.data;
      setInviteData(inv);
    } catch (err) {
      setActionError(err.message || 'Failed to disable invitation');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateInvite = async () => {
    if (!inviteData?._id) return;
    try {
      setIsGenerating(true);
      const res = await invitationService.regenerateInvitation(inviteData._id);
      const inv = res?.data?.invitation || res?.invitation || res?.data;
      setInviteData(inv);
    } catch (err) {
      setActionError(err.message || 'Failed to regenerate invitation');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRoleChange = async (targetUserId, newRole) => {
    try {
      setMemberLoading(true);
      await memberService.updateMemberRole(projectId, targetUserId, newRole.toLowerCase());
      if (onMembersUpdated) onMembersUpdated();
    } catch (err) {
      alert(err.message || 'Failed to update member role');
    } finally {
      setMemberLoading(false);
    }
  };

  const handleRemoveMember = async (targetUserId, targetName) => {
    if (!window.confirm(`Are you sure you want to remove ${targetName} from this project?`)) {
      return;
    }

    try {
      setMemberLoading(true);
      await memberService.removeMember(projectId, targetUserId);
      if (onMembersUpdated) onMembersUpdated();
    } catch (err) {
      alert(err.message || 'Failed to remove member');
    } finally {
      setMemberLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Invite action */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            Project Members ({members.length})
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Collaborators with access to this project workspace, tasks, files, and chat.
          </p>
        </div>

        {canManage && (
          <div className="flex flex-wrap items-center gap-2">
            {inviteData?.token && (
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-800/90 border border-slate-700/80 rounded-xl text-xs">
                <Key className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-slate-400">Project Code:</span>
                <span className="font-mono font-bold text-white tracking-wider">{inviteData.token}</span>
                <button
                  onClick={handleCopyCode}
                  className="p-1 hover:text-indigo-300 text-slate-400 transition-colors"
                  title="Copy Project Code"
                >
                  {copiedType === 'code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
            <button
              onClick={handleOpenInviteModal}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-xs flex items-center gap-2 transition-colors shadow-lg shadow-indigo-600/20"
            >
              <UserPlus className="w-4 h-4" /> Invite Members (Code & Link)
            </button>
          </div>
        )}
      </div>

      {/* Members Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-850/60 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-5">Member</th>
                <th className="py-3.5 px-5">Role</th>
                <th className="py-3.5 px-5">Joined</th>
                {canManage && <th className="py-3.5 px-5 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {members.map((member) => {
                const u = member.user || member;
                const isProjectOwner = u._id === project?.owner?._id || member.role?.toLowerCase() === 'owner';
                const isSelf = u._id === user?._id;
                const displayRole = isProjectOwner ? 'Team Lead (Owner)' : (member.role || 'Member');

                return (
                  <tr key={u._id} className="hover:bg-slate-850/40 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center space-x-3">
                        <img
                          src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'User')}&background=6366f1&color=fff`}
                          alt={u.name}
                          className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-700"
                        />
                        <div>
                          <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                            {u.name}
                            {isSelf && (
                              <span className="text-[10px] bg-slate-800 text-indigo-300 px-1.5 py-0.2 rounded font-normal">
                                You
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400">{u.email}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-5">
                      {isOwner && !isProjectOwner && !isSelf ? (
                        <select
                          value={member.role?.toLowerCase() || 'member'}
                          onChange={(e) => handleRoleChange(u._id, e.target.value)}
                          disabled={memberLoading}
                          className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-indigo-500"
                        >
                          <option value="manager">Manager</option>
                          <option value="member">Member</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          isProjectOwner
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : member.role?.toLowerCase() === 'manager'
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          {isProjectOwner && <ShieldAlert className="w-3 h-3" />}
                          {member.role?.toLowerCase() === 'manager' && <ShieldCheck className="w-3 h-3" />}
                          {displayRole}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-5 text-slate-400">
                      {member.joinedAt ? format(new Date(member.joinedAt), 'MMM d, yyyy') : 'Founding Member'}
                    </td>

                    {canManage && (
                      <td className="py-3.5 px-5 text-right">
                        {!isProjectOwner && !isSelf && (
                          <button
                            onClick={() => handleRemoveMember(u._id, u.name)}
                            disabled={memberLoading}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Remove Member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl p-6 relative">
            <button
              onClick={() => setShowInviteModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Invite Team Members</h3>
                <p className="text-xs text-slate-400">
                  Share this link with your teammates on WhatsApp, Telegram, or Email so they can join!
                </p>
              </div>
            </div>

            {actionError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {actionError}
              </div>
            )}

            {isGenerating ? (
              <div className="py-8 flex flex-col items-center justify-center space-y-2">
                <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-slate-400">Preparing secure invitation link & project code...</span>
              </div>
            ) : inviteData?.token ? (
              <div className="space-y-4">
                {/* 1. Prominent Google Meet-style Project Code Card */}
                <div className="p-4 bg-gradient-to-r from-indigo-950/60 to-purple-950/40 rounded-2xl border border-indigo-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 block mb-0.5">
                      🔑 Project Code (Google Meet Style)
                    </span>
                    <span className="text-xl sm:text-2xl font-black font-mono text-white tracking-widest">
                      {inviteData.token}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Members can enter this code at <span className="text-indigo-300 font-mono">/join</span> to enter the workspace.
                    </p>
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all flex-shrink-0"
                  >
                    {copiedType === 'code' ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-300" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>

                {/* 2. Shareable Join Link Box */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Direct Invitation Link
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsEditingDomain(!isEditingDomain)}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      <Globe className="w-3 h-3" />
                      <span>{isEditingDomain ? 'Done' : 'Change Domain URL'}</span>
                    </button>
                  </div>

                  {isEditingDomain && (
                    <div className="mb-2 p-2.5 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1.5 animate-fade-in text-xs">
                      <span className="text-slate-300 font-medium block">Custom App Domain / Real URL:</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          defaultValue={effectiveBaseUrl}
                          placeholder="e.g. https://taskflow.vercel.app"
                          id="customDomainInput"
                          className="flex-1 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const val = document.getElementById('customDomainInput')?.value;
                            handleSaveDomain(val || '');
                          }}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      readOnly
                      value={joinUrl}
                      className="flex-1 px-3 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-slate-200 select-all focus:outline-none font-mono"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm flex-shrink-0"
                    >
                      {copiedType === 'link' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      {copiedType === 'link' ? 'Copied!' : 'Copy Link'}
                    </button>
                  </div>
                </div>

                {/* 3. Action Buttons: WhatsApp & Full Message */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={handleShareWhatsApp}
                    className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Share on WhatsApp</span>
                  </button>

                  <button
                    onClick={handleCopyMessage}
                    className="py-2.5 px-3 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
                  >
                    {copiedType === 'msg' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                    <span>{copiedType === 'msg' ? 'Message Copied!' : 'Copy Invite Details'}</span>
                  </button>
                </div>

                {/* 4. Metadata Details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-850 rounded-xl border border-slate-800 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Status:</span>
                    <span className={`font-semibold ${inviteData.status === 'ACTIVE' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {inviteData.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Joined:</span>
                    <span className="font-semibold text-slate-200">
                      {inviteData.usedCount || 0} / {inviteData.maxUses || 'Unlimited'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Valid Until:</span>
                    <span className="font-semibold text-slate-200">
                      {inviteData.expiresAt ? format(new Date(inviteData.expiresAt), 'MMM d, yyyy') : 'No expiry'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Assigned Role:</span>
                    <span className="font-semibold text-indigo-400">Team Member</span>
                  </div>
                </div>

                {/* 5. Management Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <button
                    onClick={handleRegenerateInvite}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Regenerate Code & Link
                  </button>

                  {inviteData.status === 'ACTIVE' && (
                    <button
                      onClick={handleDisableInvite}
                      className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium"
                    >
                      <Slash className="w-3.5 h-3.5" /> Disable Invitation
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <button
                  onClick={handleGenerateInvite}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
                >
                  Generate Invitation Link & Code
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamWorkspace;
