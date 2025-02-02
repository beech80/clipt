import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Trophy, Gift, Star } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface ViewerChallengeCardProps {
  challenge: {
    id: string;
    title: string;
    description: string;
    current_progress: number;
    target_value: number;
    viewer_challenge_rewards: {
      tier_level: number;
      reward_type: string;
      reward_value: {
        amount?: number;
        name?: string;
        percentage?: number;
      };
    }[];
  };
  onParticipate?: () => void;
}

export function ViewerChallengeCard({ challenge, onParticipate }: ViewerChallengeCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleParticipate = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('viewer_challenge_progress')
        .insert({
          challenge_id: challenge.id,
          current_progress: 0
        });

      if (error) throw error;
      toast.success('Successfully joined the challenge!');
      onParticipate?.();
    } catch (error) {
      toast.error('Failed to join challenge');
    } finally {
      setIsLoading(false);
    }
  };

  const progressPercentage = (challenge.current_progress / challenge.target_value) * 100;

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            {challenge.title}
          </h3>
          <p className="text-sm text-muted-foreground">{challenge.description}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Progress</span>
          <span>{challenge.current_progress} / {challenge.target_value}</span>
        </div>
        <Progress value={progressPercentage} />
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Gift className="h-4 w-4" />
          Rewards
        </h4>
        <div className="grid gap-2">
          {challenge.viewer_challenge_rewards.map((reward, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <Star className="h-4 w-4 text-yellow-500" />
              <span>Tier {reward.tier_level}:</span>
              <span className="text-muted-foreground">
                {reward.reward_type === 'points' && reward.reward_value.amount && `${reward.reward_value.amount} points`}
                {reward.reward_type === 'badge' && reward.reward_value.name && `${reward.reward_value.name} badge`}
                {reward.reward_type === 'subscription_discount' && reward.reward_value.percentage && `${reward.reward_value.percentage}% subscription discount`}
                {reward.reward_type === 'merchandise_discount' && reward.reward_value.percentage && `${reward.reward_value.percentage}% merchandise discount`}
              </span>
            </div>
          ))}
        </div>
      </div>

      <Button 
        className="w-full" 
        onClick={handleParticipate}
        disabled={isLoading}
      >
        Participate in Challenge
      </Button>
    </Card>
  );
}