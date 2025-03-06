import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const PostPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center pt-20 bg-gradient-to-b from-[#1a237e] to-[#0d1b3c] text-white p-4">
      <div className="max-w-2xl w-full">
        <h1 className="text-3xl font-bold">Post ID: {id}</h1>
        <p className="mt-4">This is a placeholder for the Post page.</p>
        <div className="pt-6">
          <Button 
            onClick={() => navigate('/')}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2"
          >
            Return Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PostPage;
