import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Trophy, Star, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ChallengeLeaderboard } from './ChallengeLeaderboard';
import { useAuth } from '@/contexts/AuthContext';

interface Challenge {
  id: string;
  title: string;
  description: string;
  challenge_type: string;
  requirement_count: number;
  reward_type: string;
  reward_amount: number;
  end_date: string;
  category: string;
  current_participants: number;
  max_participants: number | null;
  progress?: number;
  leaderboard_enabled: boolean;
  user_challenges?: {
    progress: number;
    completed_at: string | null;
  }[];
}

export const ActiveChallenges = () => {
  const { user } = useAuth();

  const { data: userLevel } = useQuery({
    queryKey: ['user-level'],
    queryFn: async () => {
      if (!user) return { current_level: 1 };
      
      const { data, error } = await supabase
        .from('user_levels')
        .select('current_level')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user level:', error);
        return { current_level: 1 };
      }
      
      return data || { current_level: 1 };
    },
  });

  const { data: challenges, isLoading } = useQuery({
    queryKey: ['active-challenges', userLevel?.current_level],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('challenges')
        .select(`
          *,
          user_challenges!left (
            progress,
            completed_at
          )
        `)
        .eq('is_active', true)
        .lte('min_level', userLevel?.current_level || 1)
        .order('end_date', { ascending: true });

      if (error) throw error;

      // Filter out completed challenges
      return (data as Challenge[]).filter(challenge => 
        !challenge.user_challenges?.[0]?.completed_at
      );
    },
    enabled: !!userLevel,
  });

  if (isLoading) {
    return <div className="animate-pulse h-32 bg-muted rounded-lg" />;
  }

  if (!challenges?.length) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Trophy className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Active Challenges</h3>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        {challenges.map((challenge) => (
          <div key={challenge.id} className="space-y-4">
            <Card className="p-4 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{challenge.title}</h4>
                  <p className="text-sm text-muted-foreground">{challenge.description}</p>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Star className="w-4 h-4" />
                  <span>{challenge.reward_amount}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{challenge.user_challenges?.[0]?.progress || 0} / {challenge.requirement_count}</span>
                </div>
                <Progress 
                  value={((challenge.user_challenges?.[0]?.progress || 0) / challenge.requirement_count) * 100} 
                />
              </div>

              <div className="flex justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Trophy className="w-4 h-4" />
                  <span>{challenge.current_participants} participating</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Ends {formatDistanceToNow(new Date(challenge.end_date), { addSuffix: true })}</span>
                </div>
              </div>
            </Card>

            {challenge.leaderboard_enabled && (
              <ChallengeLeaderboard challengeId={challenge.id} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};