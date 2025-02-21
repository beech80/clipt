
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import GameBoyControls from '@/components/GameBoyControls';
import { Card } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';

const Messages = () => {
  const { user } = useAuth();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="w-6 h-6" />
        <h1 className="text-3xl font-bold">Messages</h1>
      </div>

      <Card className="p-6">
        <p className="text-center text-muted-foreground">
          No messages yet. Start a conversation!
        </p>
      </Card>

      <GameBoyControls />
    </div>
  );
};

export default Messages;
