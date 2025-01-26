import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Gamepad2 } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <div className="space-y-6 max-w-2xl">
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 rounded-lg bg-primary/20 flex items-center justify-center">
            <Gamepad2 className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h1 className="text-4xl font-bold">Welcome to the Gaming Platform</h1>
        <p className="text-xl text-muted-foreground">
          Connect with fellow gamers, share your gaming moments, and join live streams.
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild>
            <Link to="/login">Sign In</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/signup">Create Account</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;