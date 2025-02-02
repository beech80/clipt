import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ViewerChallengeCard } from './ViewerChallengeCard';

export function ViewerChallenges() {
  const { data: challenges, isLoading, refetch } = useQuery({
    queryKey: ['viewer-challenges'],
    queryFn: async () => {
      const { data: challengesData, error: challengesError } = await supabase
        .from('viewer_challenges')
        .select(`
          *,
          viewer_challenge_rewards (
            tier_level,
            reward_type,
            reward_value
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (challengesError) throw challengesError;

      const { data: progressData, error: progressError } = await supabase
        .from('viewer_challenge_progress')
        .select('*');

      if (progressError) throw progressError;

      return challengesData.map(challenge => ({
        ...challenge,
        rewards: challenge.viewer_challenge_rewards,
        current_progress: progressData.find(p => p.challenge_id === challenge.id)?.current_progress || 0
      }));
    }
  });

  if (isLoading) {
    return <div className="animate-pulse space-y-4">
      {[1, 2].map(i => (
        <div key={i} className="h-48 bg-muted rounded-lg" />
      ))}
    </div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Viewer Challenges</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {challenges?.map((challenge) => (
          <ViewerChallengeCard 
            key={challenge.id} 
            challenge={challenge}
            onParticipate={refetch}
          />
        ))}
      </div>
    </div>
  );
}