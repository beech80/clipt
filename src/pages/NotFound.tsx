import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#1a237e] to-[#0d1b3c] text-white p-4">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-7xl font-bold text-purple-400">404</h1>
        <h2 className="text-3xl font-semibold">Page Not Found</h2>
        <p className="text-gray-300">
          The page you're looking for doesn't exist or has been moved to another URL.
        </p>
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

export default NotFound;
