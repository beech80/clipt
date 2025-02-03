import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { StreamContainer } from '@/components/streaming/StreamContainer';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] space-y-4">
        <h1 className="text-2xl font-bold">Welcome to Clipt</h1>
        <p className="text-muted-foreground">Please sign in to start streaming</p>
        <Button onClick={() => navigate('/login')}>
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <StreamContainer />
    </div>
  );
}