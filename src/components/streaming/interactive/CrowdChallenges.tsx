import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Trophy, Users, Target } from 'lucide-react';

interface CrowdChallengesProps {
  streamId: string;
  userId: string;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  current_progress: number;
  target_value: number;
  reward_type: string;
  reward_amount: number;
  participants: string[];
}

export function CrowdChallenges({ streamId, userId }: CrowdChallengesProps) {
  const [challenges, setChallenges] = useState<Challenge[]>([]);

  useEffect(() => {
    const fetchChallenges = async () => {
      const { data, error } = await supabase
        .from('stream_challenges')
        .select('*')
        .eq('stream_id', streamId)
        .eq('is_active', true);

      if (error) {
        toast.error('Failed to load challenges');
        return;
      }

      setChallenges(data || []);
    };

    fetchChallenges();

    const channel = supabase
      .channel(`stream-challenges-${streamId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stream_challenges',
          filter: `stream_id=eq.${streamId}`
        },
        fetchChallenges
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamId]);

  const participateInChallenge = async (challengeId: string) => {
    try {
      const { error } = await supabase
        .from('stream_challenge_participants')
        .insert({
          challenge_id: challengeId,
          user_id: userId,
          stream_id: streamId
        });

      if (error) throw error;

      // Track interaction
      await supabase.from('stream_interactions').insert({
        stream_id: streamId,
        viewer_id: userId,
        interaction_type: 'challenge_join',
        interaction_data: { challenge_id: challengeId }
      });

      toast.success('Joined the challenge!');
    } catch (error) {
      toast.error('Failed to join challenge');
    }
  };

  return (
    <div className="space-y-4">
      {challenges.map((challenge) => (
        <Card key={challenge.id} className="p-4 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
                {challenge.title}
              </h4>
              <p className="text-sm text-muted-foreground">{challenge.description}</p>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{challenge.participants.length}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{challenge.current_progress} / {challenge.target_value}</span>
            </div>
            <Progress 
              value={(challenge.current_progress / challenge.target_value) * 100} 
            />
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Reward: {challenge.reward_amount} {challenge.reward_type}
            </div>
            {!challenge.participants.includes(userId) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => participateInChallenge(challenge.id)}
                className="flex items-center gap-2"
              >
                <Target className="h-4 w-4" />
                Join Challenge
              </Button>
            )}
          </div>
        </Card>
      ))}

      {challenges.length === 0 && (
        <div className="text-center text-muted-foreground py-8">
          No active challenges at the moment
        </div>
      )}
    </div>
  );
}