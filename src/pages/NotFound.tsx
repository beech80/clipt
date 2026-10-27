import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Search } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <main className="min-h-[calc(100dvh-160px-env(safe-area-inset-bottom,0px))] flex flex-col items-center justify-center px-4 py-8 text-center">
      <div className="gaming-card w-full p-6 sm:p-8 max-w-md">
        <div className="w-20 h-20 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Search aria-hidden="true" className="h-10 w-10 text-purple-400" />
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-2">Page Not Found</h1>
        <p className="text-gray-300 mb-6">
          Oops! The page you're looking for doesn't exist or may have been moved.
        </p>
        
        <div className="flex flex-col space-y-3">
          <Button asChild
            className="bg-purple-600 hover:bg-purple-700 text-white w-full"
          >
            <Link to="/clipts"><Home aria-hidden="true" className="mr-2 h-4 w-4" />Return to Clipts</Link>
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
        <Link to="/docs/user-guide" className="inline-flex min-h-11 items-center underline text-purple-200">Read the Clipt user guide</Link>
      </div>
    </main>
  );
};

export default NotFound;
