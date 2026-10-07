import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

export const Faq = () => {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      q: 'How does the TaskFlow project invitation system work?',
      a: 'The project owner generates a secure alphanumeric invitation link (e.g., https://taskflow.com/join/8FJ29KX9P2) with an expiration date and max-use limit. Members open the link, review the project description and creator details, and explicitly click "Join Project" to become a collaborator.',
    },
    {
      q: 'What is the Task Review Workflow?',
      a: 'Tasks follow a four-stage development pipeline: TODO → IN_PROGRESS → IN_REVIEW → DONE. When a team member completes an assigned task, they submit it for review with attached notes and files. The project owner or manager then reviews the work and can either approve it (moving to DONE) or reject it with feedback (moving back to IN_PROGRESS).',
    },
    {
      q: 'Are file attachments stored directly inside MongoDB?',
      a: 'No. File attachments (PDFs, Images, Word documents, Excel sheets, and ZIP archives) are uploaded to Cloudinary or a secure local uploads directory. Only the URL, public ID, file name, MIME type, and size metadata are stored in MongoDB.',
    },
    {
      q: 'Does TaskFlow support real-time updates without refreshing?',
      a: 'Yes. Every project has a dedicated Socket.IO room (e.g. project:<projectId>). When a member joins, a task is dragged across Kanban columns, a message is sent, or a comment is posted, the backend broadcasts real-time events to all connected project collaborators.',
    },
    {
      q: 'What roles are available in TaskFlow?',
      a: 'TaskFlow provides global roles (User and Admin) and project-level roles (Owner, Manager, and Member). Project owners have complete administrative rights over project configuration, members, and task approvals.',
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 sm:px-6">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-extrabold text-white">Frequently Asked Questions</h1>
        <p className="mt-3 text-slate-400">Everything you need to know about the TaskFlow collaborative platform.</p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, idx) => (
          <div
            key={idx}
            className="rounded-2xl glass-panel border border-slate-800 overflow-hidden transition-all"
          >
            <button
              onClick={() => setOpenIndex(openIndex === idx ? -1 : idx)}
              className="w-full p-5 text-left flex items-center justify-between font-semibold text-slate-200 hover:text-white"
            >
              <span>{faq.q}</span>
              {openIndex === idx ? (
                <ChevronUp className="w-5 h-5 text-indigo-400 shrink-0" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-500 shrink-0" />
              )}
            </button>
            {openIndex === idx && (
              <div className="px-5 pb-5 text-sm text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Faq;
