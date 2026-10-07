import React from 'react';
import { Layers, ShieldCheck, Zap, Heart } from 'lucide-react';

export const About = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">About TaskFlow</h1>
        <p className="mt-3 text-slate-400">
          Collaborative Project Management and Team Workspace platform designed for agile engineering teams.
        </p>
      </div>

      <div className="space-y-8 text-slate-300 leading-relaxed text-sm sm:text-base">
        <div className="p-6 rounded-2xl glass-panel border border-slate-800">
          <h2 className="text-xl font-bold text-white mb-3">Our Mission</h2>
          <p>
            TaskFlow bridges the gap between chaotic task tracking and true team collaboration. Built from the ground up on the MERN stack with Socket.IO, TaskFlow delivers real-time synchronization, structured task review workflows, instant invitation links, and comprehensive project analytics.
          </p>
        </div>

        <div className="p-6 rounded-2xl glass-panel border border-slate-800">
          <h2 className="text-xl font-bold text-white mb-3">Engineering Highlights</h2>
          <ul className="list-disc list-inside space-y-2 text-slate-400">
            <li><strong className="text-slate-200">Role-Based & Project-Level Permissions:</strong> Strict backend enforcement prevents unauthorized changes.</li>
            <li><strong className="text-slate-200">Non-Invasive Invitation Links:</strong> Tokens with max-use counters and expiration limits allow seamless team onboarding.</li>
            <li><strong className="text-slate-200">Real-Time Team Sockets:</strong> Project-specific rooms receive live task state changes, chat broadcasts, and notifications.</li>
            <li><strong className="text-slate-200">File Deliverables:</strong> Upload documents, PDFs, and wireframe images directly linked to tasks or chats.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default About;
