
import { useState } from "react";
import { Trophy } from "lucide-react";
import GameBoyControls from "@/components/GameBoyControls";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import PostItem from "@/components/PostItem";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const TopClips = () => {
  const { data: topClips, isLoading } = useQuery({
    queryKey: ['weekly-top-clips'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('weekly_top_clips')
        .select('*')
        .order('trophy_count', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-black/40 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center justify-center max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white">
            WEEKLY TOP CLIPS
          </h1>
        </div>
      </div>

      <div className="pt-24 space-y-8">
        <div className="grid grid-cols-1 gap-6 max-w-3xl mx-auto px-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-400"></div>
            </div>
          ) : (
            topClips?.map((clip, index) => (
              <div key={clip.post_id} className="relative">
                {/* Decorative Ranking Badge */}
                <div className="absolute -left-6 -top-6 z-10">
                  <div className={`relative w-16 h-16 ${
                    index === 0 
                      ? 'bg-gradient-to-b from-yellow-400 to-yellow-600' 
                      : index === 1 
                      ? 'bg-gradient-to-b from-gray-300 to-gray-400'
                      : index === 2 
                      ? 'bg-gradient-to-b from-amber-600 to-amber-800'
                      : 'bg-gradient-to-b from-purple-500 to-purple-700'
                  } rounded-full flex items-center justify-center shadow-lg`}>
                    <div className={`absolute inset-1 rounded-full ${
                      index === 0 
                        ? 'bg-yellow-500' 
                        : index === 1 
                        ? 'bg-gray-300'
                        : index === 2 
                        ? 'bg-amber-700'
                        : 'bg-purple-600'
                    } flex items-center justify-center`}>
                      <span className={`text-xl font-bold ${
                        index <= 1 ? 'text-black' : 'text-white'
                      }`}>#{index + 1}</span>
                    </div>
                    {/* Decorative Ribbons */}
                    <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 flex -space-x-1">
                      <div className={`w-4 h-8 ${
                        index === 0 
                          ? 'bg-yellow-600' 
                          : index === 1 
                          ? 'bg-gray-400'
                          : index === 2 
                          ? 'bg-amber-800'
                          : 'bg-purple-700'
                      } skew-x-[20deg]`}></div>
                      <div className={`w-4 h-8 ${
                        index === 0 
                          ? 'bg-yellow-600' 
                          : index === 1 
                          ? 'bg-gray-400'
                          : index === 2 
                          ? 'bg-amber-800'
                          : 'bg-purple-700'
                      } -skew-x-[20deg]`}></div>
                    </div>
                  </div>
                </div>
                
                {/* Date Badge */}
                <div className="absolute right-4 top-4 z-10 bg-black/80 px-3 py-1 rounded-full backdrop-blur-sm">
                  <span className="text-white text-sm">
                    {format(new Date(clip.created_at), 'MMM dd, yyyy')}
                  </span>
                </div>

                <div className={`gaming-card overflow-hidden rounded-xl neo-blur transition-all duration-300 shadow-xl
                  ${index === 0 
                    ? 'ring-4 ring-yellow-500/50' 
                    : index === 1 
                    ? 'ring-4 ring-gray-300/50'
                    : index === 2 
                    ? 'ring-4 ring-amber-700/50'
                    : 'ring-2 ring-purple-500/30'
                  } hover:ring-opacity-75 hover:ring-purple-500/50`}
                >
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
      </div>

      <GameBoyControls />
    </div>
  );
};

export default TopClips;
