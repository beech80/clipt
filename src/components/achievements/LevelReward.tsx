import { Card } from '@/components/ui/card';
import { Star, Trophy } from 'lucide-react';
import { useLevelRewards } from '@/hooks/useLevelRewards';

export const LevelReward = ({ level }: { level: number }) => {
  const { data: reward, isLoading } = useLevelRewards(level);

  if (isLoading || !reward) return null;

  const getRewardDisplay = () => {
    switch (reward.reward_type) {
      case 'points':
        return (
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400" />
            <span>{reward.reward_value.points} points</span>
          </div>
        );
      case 'achievement':
        return (
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-gaming-400" />
            <span>Special Achievement Unlocked!</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-2">Level {level} Reward</h3>
      {getRewardDisplay()}
    </Card>
  );
};