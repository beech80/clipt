import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import RealtimeChat from './messages/RealtimeChat';
import '../styles/cosmic-chat.css';

interface BottomChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  streamer: any;
}

const BottomChatPanel: React.FC<BottomChatPanelProps> = ({
  isOpen,
  onClose,
  streamer
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  
  // Handle clicks outside the panel to close it
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Prevent scrolling of background content when chat is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  if (!streamer) return null;
  
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="bottom-chat-container">
          <motion.div
            ref={panelRef}
            initial={{ y: 500, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 500, opacity: 0 }}
            transition={{ 
              type: "spring", 
              damping: 25, 
              stiffness: 300,
              mass: 1
            }}
            className="chat-panel cosmic-theme"
          >
            <div className="chat-header">
              <div className="streamer-info">
                <div className="avatar">
                  <img 
                    src={streamer.profilePicture || '/default-avatar.png'} 
                    alt={streamer.username} 
                    className="streamer-avatar"
                  />
                  <div className="online-indicator"></div>
                </div>
                <div className="streamer-details">
                  <h3>{streamer.displayName || streamer.username}</h3>
                  <p className="viewers">
                    <span className="dot"></span> Live • {streamer.viewerCount || 0} viewers
                  </p>
                </div>
              </div>
              
              <button 
                className="close-button"
                onClick={onClose}
                aria-label="Close chat"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="chat-content">
              <RealtimeChat
                partnerId={streamer.id}
                partnerInfo={{
                  id: streamer.id,
                  username: streamer.username,
                  displayName: streamer.displayName || streamer.username,
                  avatarUrl: streamer.profilePicture
                }}
                onClose={onClose}
                isFullPage={false}
              />
            </div>
            
            <div className="chat-footer">
              <div className="cosmic-decoration">
                <div className="star star1"></div>
                <div className="star star2"></div>
                <div className="star star3"></div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default BottomChatPanel;
