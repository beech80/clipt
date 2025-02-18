
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, TrendingUp, Trophy } from "lucide-react";
import GameBoyControls from "@/components/GameBoyControls";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import PostItem from "@/components/PostItem";
import { format } from "date-fns";

const TopClips = () => {
  const [timeRange, setTimeRange] = useState("today");
  const [category, setCategory] = useState("all");

  const { data: topClips, isLoading } = useQuery({
    queryKey: ['weekly-top-clips'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('weekly_top_clips')
        .select('*')
        .order('trophy_count', { ascending: false })
        .limit(10); // Limit to top 10
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="gameboy-header">
        <h1 className="gameboy-title">WEEKLY TOP CLIPS</h1>
      </div>

      <div className="mt-20 flex justify-end gap-2">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[150px]">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Time Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>

        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="gaming">Gaming</SelectItem>
            <SelectItem value="irl">IRL</SelectItem>
            <SelectItem value="esports">Esports</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-6 max-w-3xl mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-400"></div>
          </div>
        ) : (
          topClips?.map((clip, index) => (
            <div key={clip.post_id} className="relative">
              {/* Ranking Badge */}
              <div className="absolute -left-4 -top-4 z-10 w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                <span className="text-white font-bold text-lg">#{index + 1}</span>
              </div>
              
              {/* Date Badge */}
              <div className="absolute right-4 top-4 z-10 bg-black/80 px-3 py-1 rounded-full backdrop-blur-sm">
                <span className="text-white text-sm">
                  {format(new Date(clip.created_at), 'MMM dd, yyyy')}
                </span>
              </div>

              <div className="gaming-card overflow-hidden rounded-xl neo-blur hover:ring-2 hover:ring-purple-500/50 transition-all duration-300 shadow-xl">
                {/* Trophy Count Badge */}
                <div className="absolute left-4 top-4 z-10 bg-yellow-500/90 px-3 py-1 rounded-full backdrop-blur-sm flex items-center gap-1">
                  <Trophy className="h-4 w-4 text-white" />
                  <span className="text-white font-semibold">{clip.trophy_count}</span>
                </div>

                <PostItem
                  post={{
                    id: clip.post_id,
                    content: clip.content,
                    image_url: clip.image_url,
                    video_url: clip.video_url,
                    user_id: clip.user_id,
                    created_at: clip.created_at,
                    profiles: {
                      username: clip.username,
                      avatar_url: clip.avatar_url
                    },
                    clip_votes: [{ count: clip.trophy_count }],
                    likes_count: 0,
                    comments_count: 0,
                    is_published: true,
                    is_premium: false,
                    required_tier_id: null,
                    scheduled_publish_time: null
                  }}
                />
              </div>
            </div>
          ))
        )}
      </div>

      <GameBoyControls />
    </div>
  );
};

export default TopClips;
