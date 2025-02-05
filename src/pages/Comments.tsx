
import React from 'react';
import CommentList from '@/components/post/CommentList';
import { useParams } from 'react-router-dom';

const CommentsPage = () => {
  const { id } = useParams();

  if (!id) {
    return <div>Post ID not found</div>;
  }

  return <CommentList postId={id} onBack={() => window.history.back()} />;
};

export default CommentsPage;
