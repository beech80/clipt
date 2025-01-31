import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import GameBoyControls from '@/components/GameBoyControls';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageSquare, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const StreamingGuide = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch weekly top clips
  const { data: topClips } = useQuery({
    queryKey: ['weekly-top-clips'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('weekly_top_clips')
        .select('*')
        .limit(5);
      
      if (error) throw error;
      return data;
    }
  });

  const handleLike = async (postId: string) => {
    if (!user) {
      toast.error("Please login to like posts");
      return;
    }

    try {
      const { data: existingLike } = await supabase
        .from('likes')
        .select()
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      if (existingLike) {
        await supabase
          .from('likes')
          .delete()
          .match({ post_id: postId, user_id: user.id });
        toast.success("Post unliked!");
      } else {
        await supabase
          .from('likes')
          .insert([{ post_id: postId, user_id: user.id }]);
        toast.success("Post liked!");
      }
    } catch (error) {
      toast.error("Error updating like status");
    }
  };

  const handleTrophy = async (postId: string) => {
    if (!user) {
      toast.error("Please login to give trophies");
      return;
    }

    try {
      const { error } = await supabase
        .from('clip_votes')
        .insert([{ post_id: postId, user_id: user.id }]);

      if (error) {
        if (error.code === '23505') { // Unique violation
          toast.error("You've already given a trophy to this clip!");
        } else {
          throw error;
        }
      } else {
        toast.success("Trophy given!");
      }
    } catch (error) {
      toast.error("Error giving trophy");
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-40">
      <Card className="max-w-4xl mx-auto p-6 space-y-6">
        <h1 className="text-3xl font-bold text-center mb-8">Streaming Guide</h1>
        
        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">📈 Top Clips This Week</h2>
            <div className="space-y-4">
              {topClips?.map((clip) => (
                <Card key={clip.post_id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex items-center space-x-3 cursor-pointer"
                      onClick={() => navigate(`/profile/${clip.username}`)}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={clip.avatar_url} />
                        <AvatarFallback>{clip.username?.[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{clip.username}</span>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <button 
                        onClick={() => handleLike(clip.post_id)}
                        className="flex items-center space-x-1 text-red-500 hover:text-red-600"
                      >
                        <Heart className="h-5 w-5" />
                      </button>
                      
                      <button 
                        onClick={() => navigate(`/comments/${clip.post_id}`)}
                        className="flex items-center space-x-1 text-blue-500 hover:text-blue-600"
                      >
                        <MessageSquare className="h-5 w-5" />
                      </button>
                      
                      <button 
                        onClick={() => handleTrophy(clip.post_id)}
                        className="flex items-center space-x-1 text-yellow-500 hover:text-yellow-600"
                      >
                        <Trophy className="h-5 w-5" />
                        <span>{clip.trophy_count}</span>
                      </button>
                    </div>
                  </div>
                  
                  {clip.video_url && (
                    <video 
                      src={clip.video_url}
                      className="w-full mt-4 rounded-lg"
                      controls
                    />
                  )}
                </Card>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">🎮 Getting Started</h2>
            <p className="text-muted-foreground">
              Learn how to start streaming, set up your equipment, and engage with your audience.
              Follow our comprehensive guide to become a successful streamer.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">🎯 Best Practices</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Maintain a consistent streaming schedule</li>
              <li>Interact with your chat regularly</li>
              <li>Use high-quality equipment for better streams</li>
              <li>Network with other streamers</li>
              <li>Create engaging content</li>
            </ul>
          </section>
        </div>
      </Card>
      
      <GameBoyControls />
    </div>
  );
};

export default StreamingGuide;