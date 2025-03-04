import React, { createContext, useState, useContext, ReactNode } from 'react';
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
        postId={postId} 
        autoFocusInput={isInputFocused}
      />
    </CommentContext.Provider>
  );
};

export type { CommentContextType };
export default CommentContext;
