import React from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  ArrowRight,
  Kanban,
  MessageSquare,
  FileCheck2,
  Users,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Link2,
} from 'lucide-react';

export const Home = () => {
  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
          Where high-velocity teams{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-indigo-200 bg-clip-text text-transparent">
            plan, build, and deliver
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          From instant secure invite links and Kanban boards to real-time team chat, file sharing,
          and task review workflows. Experience seamless engineering execution.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-xl shadow-indigo-600/30 transition-all text-base"
          >
            <span>Start Collaborating Free</span>
            <ArrowRight className="w-5 h-5" />
          </Link>

          <Link
            to="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold rounded-xl transition-all text-base"
          >
            <span>Live Demo Sign In</span>
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-6 rounded-2xl glass-panel border border-slate-800 hover:border-indigo-500/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
              <Link2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-slate-100">Smart Invitation Links</h3>
            <p className="mt-2 text-sm text-slate-400">
              Generate secure invitation tokens with max-use limits & expiry dates. Team members join with a single click without manual lookups.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-panel border border-slate-800 hover:border-indigo-500/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center mb-4">
              <Kanban className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-slate-100">Interactive Kanban & Review</h3>
            <p className="mt-2 text-sm text-slate-400">
              Drag-and-drop tasks across Todo, In Progress, In Review, and Done with formal team leader approval & rejection workflows.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-panel border border-slate-800 hover:border-indigo-500/40 transition-all">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-slate-100">Real-Time Chat & File Sharing</h3>
            <p className="mt-2 text-sm text-slate-400">
              Socket.IO powered project chatrooms, task discussions, and file sharing for images, PDFs, and project documents.
            </p>
          </div>
        </div>
      </section>

      {/* Critical Workflow Demonstration */}
      <section className="py-16 bg-slate-900/50 border-t border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              End-to-End Collaborative Engineering Flow
            </h2>
            <p className="mt-3 text-slate-400 text-sm sm:text-base">
              Engineered to emulate production workspaces used by top software engineering teams.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center mx-auto mb-3 text-sm">
                1
              </span>
              <h4 className="font-semibold text-slate-200">Create & Invite</h4>
              <p className="text-xs text-slate-400 mt-1">
                Leader creates project, generates secure link, and shares with members.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center mx-auto mb-3 text-sm">
                2
              </span>
              <h4 className="font-semibold text-slate-200">Assign & Execute</h4>
              <p className="text-xs text-slate-400 mt-1">
                Tasks assigned with checklists, priorities, and deadlines.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center mx-auto mb-3 text-sm">
                3
              </span>
              <h4 className="font-semibold text-slate-200">Review & Verify</h4>
              <p className="text-xs text-slate-400 mt-1">
                Members upload deliverables and submit for team leader sign-off.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center mx-auto mb-3 text-sm">
                4
              </span>
              <h4 className="font-semibold text-slate-200">Track & Deliver</h4>
              <p className="text-xs text-slate-400 mt-1">
                Real-time MongoDB analytics, activity timeline, and burndown velocity.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
