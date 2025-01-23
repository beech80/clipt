import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Medal, Crown, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface LeaderboardEntry {
  user_id: string;
  score: number;
  rank: number;
  achievement_points: number;
  win_streak: number;
  total_wins: number;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
}

export function EnhancedLeaderboard({ challengeId }: { challengeId: string }) {
  const { data: leaderboardData, isLoading } = useQuery({
    queryKey: ['leaderboard', challengeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('challenge_leaderboard')
        .select(`
          *,
          profiles (
            username,
            avatar_url
          )
        `)
        .eq('challenge_id', challengeId)
        .order('score', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as LeaderboardEntry[];
    },
  });

  if (isLoading) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  return (
    <Card className="p-4">
      <Tabs defaultValue="all_time" className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="all_time">
              <Trophy className="w-4 h-4 mr-2" />
              All Time
            </TabsTrigger>
            <TabsTrigger value="monthly">
              <Crown className="w-4 h-4 mr-2" />
              Monthly
            </TabsTrigger>
            <TabsTrigger value="weekly">
              <Medal className="w-4 h-4 mr-2" />
              Weekly
            </TabsTrigger>
            <TabsTrigger value="daily">
              <Calendar className="w-4 h-4 mr-2" />
              Daily
            </TabsTrigger>
          </TabsList>

          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="gaming">Gaming</SelectItem>
              <SelectItem value="creative">Creative</SelectItem>
              <SelectItem value="irl">IRL</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="all_time" className="space-y-4">
          {leaderboardData?.map((entry, index) => (
            <div
              key={entry.user_id}
              className="flex items-center justify-between p-3 bg-muted rounded-lg"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold w-8">{index + 1}</span>
                <img
                  src={entry.profiles.avatar_url || "/placeholder.svg"}
                  alt={entry.profiles.username}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="font-medium">{entry.profiles.username}</p>
                  <p className="text-sm text-muted-foreground">
                    {entry.win_streak} streak • {entry.total_wins} wins
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold">{entry.score.toLocaleString()} pts</p>
                <p className="text-sm text-muted-foreground">
                  {entry.achievement_points} achievements
                </p>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="monthly">
          {/* Similar content structure as all_time */}
        </TabsContent>

        <TabsContent value="weekly">
          {/* Similar content structure as all_time */}
        </TabsContent>

        <TabsContent value="daily">
          {/* Similar content structure as all_time */}
        </TabsContent>
      </Tabs>
    </Card>
  );
}