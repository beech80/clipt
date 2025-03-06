import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Search } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a237e] to-[#0d1b3c] flex flex-col items-center justify-center px-4 text-center">
      <div className="bg-black/30 backdrop-blur-sm rounded-xl p-8 border border-white/10 shadow-xl max-w-md">
        <div className="w-20 h-20 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Search className="h-10 w-10 text-purple-400" />
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-2">Page Not Found</h1>
        <p className="text-gray-300 mb-6">
          Oops! The page you're looking for doesn't exist or may have been moved.
        </p>
        
        <div className="flex flex-col space-y-3">
          <Button 
            onClick={() => navigate('/')}
            className="bg-purple-600 hover:bg-purple-700 text-white w-full"
          >
            <Home className="mr-2 h-4 w-4" />
            Return Home
          </Button>
          
          <Button 
            onClick={() => navigate(-1)}
            variant="outline"
            className="border-gray-700 text-gray-300 hover:bg-gray-800 w-full"
          >
            Go Back
          </Button>
        </div>
      </div>
      
      <div className="mt-8 text-gray-400 text-sm">
        <p>Need help? Contact our support team</p>
      </div>
    </div>
  );
};

export default NotFound;
