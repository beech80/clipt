
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import CommentModal from '@/components/comments/CommentModal';

interface CommentContextType {
  openComments: (postId: string) => void;
  closeComments: () => void;
  isCommentsOpen: boolean;
  currentPostId: string | undefined;
  openCommentInput: (postId: string) => void;
}

const CommentContext = createContext<CommentContextType | undefined>(undefined);

export const useComments = () => {
  const context = useContext(CommentContext);
  if (context === undefined) {
    throw new Error('useComments must be used within a CommentsProvider');
  }
  return context;
};

interface CommentsProviderProps {
  children: ReactNode;
}

export const CommentsProvider: React.FC<CommentsProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [postId, setPostId] = useState<string | undefined>(undefined);
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Listen for gameboy controller comment events
  useEffect(() => {
    const handleGameboyCommentEvent = (e: CustomEvent) => {
      if (e.detail && e.detail.postId) {
        console.log('CommentContext received gameboy event for post:', e.detail.postId);
        
        // Important: Delay the execution slightly to let any click events resolve first
        setTimeout(() => {
          openCommentInput(e.detail.postId);
          // Set a flag that the event was handled by the context
          (window as any).__commentEventHandled = true;
        }, 10);
      }
    };

    window.addEventListener('gameboy_open_comments' as any, handleGameboyCommentEvent as EventListener);
    
    return () => {
      window.removeEventListener('gameboy_open_comments' as any, handleGameboyCommentEvent as EventListener);
    };
  }, []);

  const openComments = (id: string) => {
    console.log('Opening comments for post:', id);
    setPostId(id);
    setIsOpen(true);
    setIsInputFocused(false);
  };

  const closeComments = () => {
    setIsOpen(false);
    setIsInputFocused(false);
  };
  
  const openCommentInput = (id: string) => {
    console.log('Opening comment input for post:', id);
    setPostId(id);
    setIsOpen(true);
    setIsInputFocused(true);
  };

  return (
    <CommentContext.Provider
      value={{
        openComments,
        closeComments,
        isCommentsOpen: isOpen,
        currentPostId: postId,
        openCommentInput,
      }}
    >
      {children}
      <CommentModal 
        isOpen={isOpen} 
        onClose={closeComments} 
        postId={postId || ''} 
        autoFocusInput={isInputFocused}
      />
    </CommentContext.Provider>
  );
};

export type { CommentContextType };
export default CommentContext;
