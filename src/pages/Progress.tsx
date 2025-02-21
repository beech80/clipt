import { useAuth } from '@/contexts/AuthContext';
import { AchievementProgress } from '@/components/achievements/AchievementProgress';
import { Card } from '@/components/ui/card';
import { Trophy, Star, Award, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { BackButton } from '@/components/ui/back-button';
import GameBoyControls from '@/components/GameBoyControls';

const Progress = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-8 text-center space-y-4">
          <LogIn className="w-12 h-12 mx-auto text-muted-foreground" />
          <h2 className="text-2xl font-bold">Sign in to Track Progress</h2>
          <p className="text-muted-foreground">
            Sign in to view your achievements and track your progress
          </p>
          <Button onClick={() => navigate('/login')}>
            Sign In
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 pb-40">
      <div className="flex items-center gap-4">
        <BackButton />
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Trophy className="h-6 w-6 text-primary" />
          Your Progress
        </h1>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Star className="h-5 w-5 text-yellow-500" />
              <h2 className="text-xl font-semibold">Level Progress</h2>
            </div>
            <div className="space-y-4">
              {/* Level progress will be implemented here */}
              <p className="text-muted-foreground">Track your gaming journey and level progression</p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Award className="h-5 w-5 text-purple-500" />
              <h2 className="text-xl font-semibold">Recent Achievements</h2>
            </div>
            <div className="space-y-4">
              {/* Recent achievements will be shown here */}
              <p className="text-muted-foreground">Your latest gaming accomplishments</p>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <AchievementProgress />
        </div>
      </div>
      
      <GameBoyControls />
    </div>
  );
};

export default Progress;