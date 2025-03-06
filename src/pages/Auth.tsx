import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BackButton } from '@/components/ui/back-button';

const Auth = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a237e] to-[#0d1b3c]">
      <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-black/40 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center justify-center max-w-7xl mx-auto relative">
          <BackButton />
          <h1 className="text-3xl font-bold text-white">Sign In</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-24 pb-20 max-w-md">
        <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-white/10 shadow-xl">
          <form className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="Enter your email" 
                className="bg-gray-800/50 border-gray-700 text-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">Password</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="Enter your password" 
                className="bg-gray-800/50 border-gray-700 text-white"
              />
            </div>
            
            <Button 
              type="button"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              Sign In
            </Button>
            
            <div className="text-center">
              <p className="text-white/60 text-sm">
                Don't have an account? 
                <Button 
                  variant="link" 
                  className="text-purple-400 hover:text-purple-300"
                  onClick={() => navigate('/')}
                >
                  Sign Up
                </Button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Auth;
