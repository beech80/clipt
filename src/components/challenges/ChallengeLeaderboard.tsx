import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import { supabase } from "@/lib/supabase";

export const ChallengeLeaderboard = ({ challengeId }: { challengeId: string }) => {
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['challenge-leaderboard', challengeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('challenge_leaderboard')
        .select(`
          *,
          user:profiles(username, avatar_url)
        `)
        .eq('challenge_id', challengeId)
        .order('score', { ascending: false })
        .limit(10)
        .throwOnError();

      if (error) {
        console.error('Error fetching leaderboard:', error);
        throw error;
      }
      return data;
    },
  });

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-4 bg-muted rounded"></div>
                <div className="flex-1 h-4 bg-muted rounded"></div>
                <div className="w-12 h-4 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (!leaderboard?.length) return null;

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Leaderboard</h3>
        </div>

        <div className="space-y-2">
          {leaderboard.map((entry, index) => (
            <div key={entry.id} className="flex items-center gap-3">
              <span className="w-6 text-center font-medium">#{index + 1}</span>
              <div className="flex-1 flex items-center gap-2">
                <img
                  src={entry.user?.avatar_url || "/placeholder.svg"}
                  alt={entry.user?.username}
                  className="w-6 h-6 rounded-full"
                />
                <span>{entry.user?.username}</span>
              </div>
              <span className="font-medium">{entry.score} pts</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};