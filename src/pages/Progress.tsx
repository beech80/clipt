
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import GameBoyControls from '@/components/GameBoyControls';
import { Card } from '@/components/ui/card';
import { Trophy, Gamepad2, Clock } from 'lucide-react';

const Progress = () => {
  const { user } = useAuth();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Your Gaming Progress</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <div>
              <h3 className="text-xl font-semibold">Achievements</h3>
              <p className="text-muted-foreground">Track your milestones</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Gamepad2 className="w-8 h-8 text-purple-500" />
            <div>
              <h3 className="text-xl font-semibold">Games Played</h3>
              <p className="text-muted-foreground">Your gaming history</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Clock className="w-8 h-8 text-blue-500" />
            <div>
              <h3 className="text-xl font-semibold">Time Played</h3>
              <p className="text-muted-foreground">Gaming statistics</p>
            </div>
          </div>
        </Card>
      </div>

      <GameBoyControls />
    </div>
  );
};

export default Progress;
