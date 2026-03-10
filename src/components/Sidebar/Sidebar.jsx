import React, { useContext, useState } from "react";
import "./Sidebar.css";
import { assets } from "../../assets/assets";
import { Context } from "../../context/Context";
import { 
  MoreVertical, 
  Pin, 
  Trash2, 
  Edit2, 
  Share2, 
  MessageSquare,
  Plus,
  Settings,
  History,
  HelpCircle,
  PinOff,
  AlertCircle
} from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";

const Sidebar = () => {
  const [extended, setExtended] = useState(false);
  const { 
    onSent, 
    setRecentPrompt, 
    newChat, 
    filteredSessions, 
    loadSession, 
    renameSession, 
    deleteSession, 
    pinSession,
    sessionId 
  } = useContext(Context);

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const handleRename = (id, title) => {
    setEditingId(id);
    setEditTitle(title);
  };

  const submitRename = (id) => {
    if (editTitle.trim()) {
      renameSession(id, editTitle);
    }
    setEditingId(null);
  };

  const pinnedSessions = filteredSessions.filter(s => s.isPinned);
  const otherSessions = filteredSessions.filter(s => !s.isPinned);

  const SessionItem = ({ session }) => (
    <motion.div 
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`recent-entry group ${sessionId === session._id ? 'active' : ''}`}
      onClick={() => editingId !== session._id && loadSession(session._id)}
    >
      <MessageSquare size={18} />
      {editingId === session._id ? (
        <input 
          autoFocus
          className="rename-input"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={() => submitRename(session._id)}
          onKeyDown={(e) => e.key === 'Enter' && submitRename(session._id)}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <p>{session.title}</p>
      )}
      
      <div className="menu-container opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
        <Popover.Root>
          <Popover.Trigger asChild>
            <button className="menu-btn" onClick={(e) => e.stopPropagation()}>
              <MoreVertical size={16} />
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content className="popover-content" sideOffset={5} align="end">
              <button className="popover-item" onClick={() => pinSession(session._id, !session.isPinned)}>
                {session.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
                <span>{session.isPinned ? 'Unpin' : 'Pin'}</span>
              </button>
              <button className="popover-item" onClick={() => handleRename(session._id, session.title)}>
                <Edit2 size={14} />
                <span>Rename</span>
              </button>
              <button className="popover-item delete" onClick={() => setDeleteConfirmId(session._id)}>
                <Trash2 size={14} />
                <span>Delete</span>
              </button>
              <Popover.Arrow className="popover-arrow" />
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>
    </motion.div>
  );

  return (
    <div className={`sidebar ${extended ? "extended" : ""}`}>
      <div className="top">
        <img
          onClick={() => setExtended((prev) => !prev)}
          className="menu"
          src={assets.menu_icon}
          alt=""
        />
        <div onClick={() => newChat()} className="new-chat">
          <img src={assets.plus_icon} alt="" />
          {extended ? <p>New Chat</p> : null}
        </div>
        {extended ? (
          <div className="recent">
            <p className="recent-title">Recent</p>
            <div className="recent-list">
              <AnimatePresence mode="popLayout">
                {pinnedSessions.length > 0 && (
                  <div className="session-section">
                    <div className="section-header">
                      <Pin size={12} /> <span>Pinned</span>
                    </div>
                    {pinnedSessions.map((session) => (
                      <SessionItem key={session._id} session={session} />
                    ))}
                  </div>
                )}
                <div className="session-section">
                  {pinnedSessions.length > 0 && otherSessions.length > 0 && (
                    <div className="section-header">
                      <span>Others</span>
                    </div>
                  )}
                  {otherSessions.map((session) => (
                    <SessionItem key={session._id} session={session} />
                  ))}
                </div>
              </AnimatePresence>
            </div>
          </div>
        ) : null}
      </div>
      <div className="bottom">
        <div className="bottom-item recent-entry">
          <HelpCircle size={20} />
          {extended ? <p>Help</p> : null}
        </div>
        <div className="bottom-item recent-entry">
          <History size={20} />
          {extended ? <p>Activity</p> : null}
        </div>
        <div className="bottom-item recent-entry">
          <Settings size={20} />
          {extended ? <p>Settings</p> : null}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog.Root open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="dialog-content delete-modal">
            <div className="modal-header">
              <AlertCircle color="#e53e3e" size={24} />
              <Dialog.Title className="dialog-title">Delete chat?</Dialog.Title>
            </div>
            <Dialog.Description className="dialog-description">
              This will delete your chat history. This action cannot be undone.
            </Dialog.Description>
            <div className="modal-footer">
              <Dialog.Close asChild>
                <button className="cancel-btn">Cancel</button>
              </Dialog.Close>
              <button 
                className="confirm-delete-btn" 
                onClick={() => {
                  deleteSession(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
              >
                Delete
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};

export default Sidebar;
