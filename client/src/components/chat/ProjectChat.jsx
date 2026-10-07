import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Paperclip, 
  Image as ImageIcon, 
  FileText, 
  Trash2, 
  Smile, 
  Clock, 
  X,
  ExternalLink,
  MessageSquare,
  CheckCheck,
  Maximize2
} from 'lucide-react';
import { format } from 'date-fns';
import { chatService } from '../../services/chatService';
import { fileService } from '../../services/fileService';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';

const QUICK_EMOJIS = ['👍', '❤️', '🚀', '🎉', '🔥', '👏', '💯', '🙌', '✅', '⭐'];

export const ProjectChat = ({ projectId, isManagerOrOwner = false }) => {
  const { user } = useAuth();
  const { socket, joinProjectRoom, leaveProjectRoom } = useSocket();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [previewImage, setPreviewImage] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (projectId) {
      loadMessages();
      if (joinProjectRoom) {
        joinProjectRoom(projectId);
      }
    }

    return () => {
      if (projectId && leaveProjectRoom) {
        leaveProjectRoom(projectId);
      }
    };
  }, [projectId]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data) => {
      const msg = data?.message || data;
      const targetProjId = data?.projectId || data?.project || msg?.project;
      if (targetProjId === projectId || msg?.project === projectId) {
        setMessages(prev => {
          // Avoid duplicate messages if already present
          if (prev.some(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        scrollToBottom();
      }
    };

    const handleMessageDeleted = ({ messageId }) => {
      setMessages(prev => prev.filter(m => m._id !== messageId));
    };

    const handleUserTyping = ({ userId, name, isTyping }) => {
      setTypingUsers(prev => {
        const next = new Set(prev);
        if (isTyping && userId !== user?._id) {
          next.add(name || 'Teammate');
        } else {
          next.delete(name || 'Teammate');
        }
        return next;
      });
    };

    socket.on('message:new', handleNewMessage);
    socket.on('chat:message', handleNewMessage);
    socket.on('message:deleted', handleMessageDeleted);
    socket.on('chat:message_deleted', handleMessageDeleted);
    socket.on('chat:user_typing', handleUserTyping);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('chat:message', handleNewMessage);
      socket.off('message:deleted', handleMessageDeleted);
      socket.off('chat:message_deleted', handleMessageDeleted);
      socket.off('chat:user_typing', handleUserTyping);
    };
  }, [socket, projectId, user]);

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const res = await chatService.getMessages(projectId);
      const list = res?.data?.messages || res?.messages || (Array.isArray(res?.data) ? res.data : []);
      setMessages(list);
      scrollToBottom();
    } catch (err) {
      console.error('Failed to load project messages', err);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    if (!socket) return;

    socket.emit('chat:typing', { projectId, isTyping: true });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('chat:typing', { projectId, isTyping: false });
    }, 1500);
  };

  const handleAddEmoji = (emoji) => {
    setInputMessage(prev => prev + emoji);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const res = await fileService.uploadProjectAttachment(projectId, file);
      const att = res?.data?.attachment || res?.attachment || res?.data;
      if (att) {
        setAttachments(prev => [...prev, att]);
      }
    } catch (err) {
      alert(err.message || 'Failed to upload photo or file');
    } finally {
      setIsUploading(false);
      e.target.value = null;
    }
  };

  const handleRemoveAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() && attachments.length === 0) return;

    const payload = {
      content: inputMessage.trim(),
      attachments: attachments.map(a => a._id),
    };

    try {
      const res = await chatService.sendMessage(projectId, payload);
      const createdMessage = res?.data?.message || res?.message || res?.data;
      if (createdMessage) {
        setMessages(prev => {
          if (prev.some(m => m._id === createdMessage._id)) return prev;
          return [...prev, createdMessage];
        });
      }
      setInputMessage('');
      setAttachments([]);
      setShowEmojiPicker(false);
      scrollToBottom();
    } catch (err) {
      alert(err.message || 'Failed to send message');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await chatService.deleteMessage(messageId);
      setMessages(prev => prev.filter(m => m._id !== messageId));
    } catch (err) {
      alert(err.message || 'Failed to delete message');
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl flex flex-col h-[750px] overflow-hidden shadow-2xl relative">
      {/* WhatsApp-Style Chat Header */}
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-850/90 flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Team Workspace Discussion
            </h3>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Team Room
              </span>
              {typingUsers.size > 0 && (
                <span className="text-[11px] text-indigo-400 italic">
                  {Array.from(typingUsers).join(', ')} is typing...
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="text-right text-xs text-slate-400">
          <span>WhatsApp-Style Realtime Chat & File Sharing</span>
        </div>
      </div>

      {/* Messages Feed Area with WhatsApp-style background pattern */}
      <div 
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4"
        style={{
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }}
      >
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center space-y-2">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-400">Loading team messages...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-3 text-slate-500 max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-slate-850 flex items-center justify-center text-slate-600">
              <MessageSquare className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-300">No messages in this workspace yet</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Start the discussion! Ask questions, share project updates, drop screenshots, wireframes, or documents.
            </p>
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.sender?._id === user?._id || msg.sender === user?._id;
            const senderName = msg.sender?.name || 'Teammate';
            const senderAvatar = msg.sender?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName)}&background=10b981&color=fff`;

            return (
              <div 
                key={msg._id} 
                className={`flex items-start gap-2.5 group ${isMe ? 'flex-row-reverse' : ''}`}
              >
                {!isMe && (
                  <img
                    src={senderAvatar}
                    alt={senderName}
                    className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-700 mt-1 flex-shrink-0"
                  />
                )}

                <div className={`max-w-[80%] sm:max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {/* Sender Name above message if not me */}
                  {!isMe && (
                    <span className="text-[11px] font-bold text-indigo-400 ml-1 mb-0.5">
                      {senderName}
                    </span>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`rounded-2xl p-3 shadow-md relative group/bubble ${
                      isMe
                        ? 'bg-emerald-600 text-white rounded-tr-sm shadow-emerald-600/10'
                        : 'bg-slate-800 text-slate-100 rounded-tl-sm border border-slate-750'
                    }`}
                  >
                    {/* Inline Image Attachment (WhatsApp style) */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="space-y-2 mb-2">
                        {msg.attachments.map(att => {
                          const isImg = att.fileType?.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(att.fileName || '');

                          if (isImg) {
                            return (
                              <div 
                                key={att._id} 
                                className="relative rounded-xl overflow-hidden cursor-pointer group/img max-w-sm"
                                onClick={() => setPreviewImage(att.fileUrl)}
                              >
                                <img
                                  src={att.fileUrl}
                                  alt={att.fileName}
                                  className="w-full max-h-64 object-cover rounded-xl hover:opacity-95 transition-opacity"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                                  <span className="text-xs text-white bg-black/60 px-2.5 py-1 rounded-lg flex items-center gap-1">
                                    <Maximize2 className="w-3.5 h-3.5" /> Enlarge Photo
                                  </span>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <a
                              key={att._id}
                              href={att.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex items-center space-x-2.5 p-2.5 rounded-xl border transition-colors ${
                                isMe 
                                  ? 'bg-emerald-700/60 border-emerald-500/40 text-white hover:bg-emerald-700' 
                                  : 'bg-slate-900/80 border-slate-700 text-slate-200 hover:bg-slate-900'
                              }`}
                            >
                              <FileText className="w-5 h-5 text-indigo-300 flex-shrink-0" />
                              <div className="overflow-hidden flex-1 min-w-0">
                                <span className="text-xs font-semibold block truncate">{att.fileName}</span>
                                <span className="text-[10px] opacity-75">
                                  {att.fileSize ? `${Math.round(att.fileSize / 1024)} KB` : 'Document'}
                                </span>
                              </div>
                              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                            </a>
                          );
                        })}
                      </div>
                    )}

                    {/* Text Content */}
                    {msg.content && (
                      <p className="text-xs leading-relaxed whitespace-pre-wrap select-text break-words">
                        {msg.content}
                      </p>
                    )}

                    {/* Timestamp & double checkmarks */}
                    <div className={`flex items-center space-x-1.5 mt-1 text-[10px] ${isMe ? 'justify-end text-emerald-200' : 'justify-end text-slate-400'}`}>
                      <span>{msg.createdAt ? format(new Date(msg.createdAt), 'h:mm a') : ''}</span>
                      {isMe && <CheckCheck className="w-3.5 h-3.5 text-emerald-300" />}
                    </div>
                  </div>

                  {/* Delete option */}
                  {(isMe || isManagerOrOwner) && (
                    <button
                      onClick={() => handleDeleteMessage(msg._id)}
                      className="opacity-0 group-hover:opacity-100 text-[10px] text-slate-500 hover:text-rose-400 mt-0.5 transition-opacity px-1"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Image Preview Modal (WhatsApp Photo Viewer) */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={previewImage} 
              alt="Shared preview" 
              className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain ring-1 ring-white/10"
            />
          </div>
        </div>
      )}

      {/* Attachment staging list (before sending) */}
      {attachments.length > 0 && (
        <div className="px-6 py-2.5 bg-slate-850 border-t border-slate-800 flex flex-wrap gap-2 items-center">
          <span className="text-[11px] text-slate-400 font-semibold">Ready to send:</span>
          {attachments.map((att, idx) => (
            <div
              key={idx}
              className="flex items-center space-x-2 bg-slate-800 px-3 py-1 rounded-xl border border-slate-700 text-xs text-slate-200"
            >
              {att.fileType?.startsWith('image/') ? (
                <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
              )}
              <span className="max-w-[140px] truncate">{att.fileName}</span>
              <button
                type="button"
                onClick={() => handleRemoveAttachment(idx)}
                className="text-slate-400 hover:text-rose-400"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Quick Emojis Bar (WhatsApp Style) */}
      {showEmojiPicker && (
        <div className="px-4 py-2 bg-slate-850/90 border-t border-slate-800 flex items-center gap-2 overflow-x-auto">
          {QUICK_EMOJIS.map(em => (
            <button
              key={em}
              type="button"
              onClick={() => handleAddEmoji(em)}
              className="text-lg p-1.5 hover:bg-slate-750 rounded-lg hover:scale-125 transition-transform"
            >
              {em}
            </button>
          ))}
        </div>
      )}

      {/* WhatsApp Input Bar */}
      <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-slate-800 bg-slate-850 flex items-center space-x-2">
        {/* Emoji Button */}
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className={`p-2.5 rounded-xl transition-colors ${
            showEmojiPicker ? 'bg-indigo-600/30 text-indigo-300' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Quick emojis"
        >
          <Smile className="w-5 h-5" />
        </button>

        {/* Photo & Document Attach Button */}
        <label 
          className="p-2.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer transition-colors"
          title="Share Photos, Wireframes, PDFs or Documents"
        >
          <Paperclip className="w-5 h-5" />
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            disabled={isUploading}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip"
          />
        </label>

        {/* Text Input */}
        <input
          type="text"
          value={inputMessage}
          onChange={handleInputChange}
          placeholder={isUploading ? 'Uploading photo/file...' : 'Message team or type a doubt...'}
          disabled={isUploading}
          className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700/80 rounded-2xl text-xs sm:text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
        />

        {/* Send Button */}
        <button
          type="submit"
          disabled={(!inputMessage.trim() && attachments.length === 0) || isUploading}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors shadow-lg shadow-emerald-600/20"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </div>
  );
};

export default ProjectChat;
