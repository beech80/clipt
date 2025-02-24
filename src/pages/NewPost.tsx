
import React from 'react';
import { PostForm } from '@/components/post/PostForm';

const NewPost = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Create New Post</h1>
      <PostForm />
    </div>
  );
};

export default NewPost;
