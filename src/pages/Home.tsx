
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import GameBoyControls from '@/components/GameBoyControls';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-gaming-900 to-gaming-950">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center space-y-6 animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-bold text-white">
            Welcome to Gaming Hub
          </h1>
          <p className="text-xl text-gray-300">
            Your ultimate destination for gaming content and community
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            {!user ? (
              <>
                <Button 
                  onClick={() => navigate('/signup')}
                  size="lg"
                  className="bg-primary hover:bg-primary/90"
                >
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  onClick={() => navigate('/login')}
                  size="lg"
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Sign In
                </Button>
              </>
            ) : (
              <Button 
                onClick={() => navigate('/posts')}
                size="lg"
                className="bg-primary hover:bg-primary/90"
              >
                View Posts <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="p-6 bg-gaming-800/50 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-2">Share Clips</h3>
              <p className="text-gray-400">Upload and share your best gaming moments</p>
            </div>
            <div className="p-6 bg-gaming-800/50 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-2">Join Communities</h3>
              <p className="text-gray-400">Connect with other gamers and join discussions</p>
            </div>
            <div className="p-6 bg-gaming-800/50 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-2">Track Progress</h3>
              <p className="text-gray-400">Monitor your gaming achievements and stats</p>
            </div>
          </div>
        </div>
      </div>

      <GameBoyControls />
    </div>
  );
};

export default Home;
