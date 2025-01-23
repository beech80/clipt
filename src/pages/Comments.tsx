import React from 'react';
import { useParams } from 'react-router-dom';

export default function Comments() {
  const { postId } = useParams();
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Comments for Post {postId}</h1>
      {/* Comments implementation will go here */}
    </div>
  );
}