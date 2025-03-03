import React, { createContext, useState, useContext, ReactNode } from 'react';
import CommentModal from '@/components/comments/CommentModal';

interface CommentContextType {
  openComments: (postId: string) => void;
  closeComments: () => void;
  isCommentsOpen: boolean;
  currentPostId: string | undefined;
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

  const openComments = (id: string) => {
    console.log('Opening comments for post:', id);
    setPostId(id);
    setIsOpen(true);
  };

  const closeComments = () => {
    setIsOpen(false);
  };

  return (
    <CommentContext.Provider
      value={{
        openComments,
        closeComments,
        isCommentsOpen: isOpen,
        currentPostId: postId,
      }}
    >
      {children}
      <CommentModal 
        isOpen={isOpen} 
        onClose={closeComments} 
        postId={postId} 
      />
    </CommentContext.Provider>
  );
};
