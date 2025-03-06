import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Auth = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#1a237e] to-[#0d1b3c] text-white p-4">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-3xl font-bold">Authentication</h1>
        <p>This is a placeholder for the Auth page.</p>
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

export default Auth;
