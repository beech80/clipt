import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Loader2, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function TopWeeklyClips() {
  const navigate = useNavigate();
  const [weekStart, setWeekStart] = useState('');
  const [weekEnd, setWeekEnd] = useState('');
  
  useEffect(() => {
    // Calculate the start and end of the current week (Sunday to Saturday)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 is Sunday, 6 is Saturday
    
    // Start of week (this past Sunday)
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - dayOfWeek);
    startDate.setHours(0, 0, 0, 0);
    
    // End of week (this coming Saturday)
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);
    
    setWeekStart(startDate.toISOString().split('T')[0]);
    setWeekEnd(endDate.toISOString().split('T')[0]);
    
    console.log("Set date range:", startDate.toISOString(), "to", endDate.toISOString());
  }, []);
  
  const { data: topClips, isLoading, error } = useQuery({
    queryKey: ['weekly-top-clips', weekStart, weekEnd],
    queryFn: async () => {
      // Only run the query if we have valid dates
      if (!weekStart || !weekEnd) return [];
      
      console.log(`Fetching top clips from ${weekStart} to ${weekEnd}`);
      
      // First, get posts with their vote counts
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          image_url,
          video_url,
          user_id,
          created_at,
          profiles:user_id (
            username,
            avatar_url
          ),
          games:game_id (
            name
          )
        `)
        .gte('created_at', `${weekStart}T00:00:00Z`)
        .lte('created_at', `${weekEnd}T23:59:59Z`)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (postsError) {
        console.error('Error fetching posts:', postsError);
        throw postsError;
      }
      
      // If no posts, return empty array
      if (!posts || posts.length === 0) {
        return [];
      }
      
      // Get vote counts for these posts
      const postIds = posts.map(post => post.id);
      
      const { data: voteData, error: voteError } = await supabase
        .from('clip_votes')
        .select('post_id, count')
        .in('post_id', postIds);
      
      if (voteError) {
        console.error('Error fetching vote counts:', voteError);
        throw voteError;
      }
      
      // Create a map of post_id to vote count
      const voteCountMap = {};
      
      voteData?.forEach(vote => {
        if (!voteCountMap[vote.post_id]) {
          voteCountMap[vote.post_id] = 0;
        }
        voteCountMap[vote.post_id] += 1;
      });
      
      // Add vote counts to posts
      const postsWithVotes = posts.map(post => ({
        ...post,
        vote_count: voteCountMap[post.id] || 0
      }));
      
      // Sort by vote count and return top 10
      return postsWithVotes
        .sort((a, b) => b.vote_count - a.vote_count)
        .slice(0, 10);
    },
    enabled: Boolean(weekStart && weekEnd),
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
  
  const handleClipClick = (clipId: string) => {
    navigate(`/post/${clipId}`);
  };
  
  if (isLoading) {
    return (
      <Card className="w-full bg-[#1A1F2C]">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Top Weekly Clips
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-yellow-500" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full bg-[#1A1F2C]">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Top Weekly Clips
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0">
        {topClips && topClips.length > 0 ? (
          <div className="space-y-2">
            {topClips.map((clip, index) => (
              <div 
                key={clip.id}
                className="flex items-center p-2 hover:bg-[#252A38] rounded-lg cursor-pointer transition-all duration-200"
                onClick={() => handleClipClick(clip.id)}
              >
                <div className="flex-shrink-0 w-6 text-center mr-3">
                  <span className={`font-bold ${index < 3 ? 'text-yellow-500' : 'text-gray-400'}`}>
                    {index + 1}
                  </span>
                </div>
                
                <div className="flex-grow min-w-0">
                  <div className="flex items-center">
                    <Avatar className="h-6 w-6 mr-2">
                      <AvatarImage src={clip.profiles?.avatar_url || ''} />
                      <AvatarFallback>{clip.profiles?.username?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-semibold truncate text-gray-300">
                      {clip.profiles?.username}
                    </span>
                  </div>
                  <p className="text-sm truncate mt-1">
                    {clip.title || 'Untitled clip'}
                  </p>
                </div>
                
                <div className="flex items-center ml-3 flex-shrink-0">
                  <Trophy className="h-4 w-4 text-yellow-500 mr-1" />
                  <span className="text-yellow-500 font-semibold">
                    {clip.vote_count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-gray-400">
            <p>No top clips for this week yet</p>
            <p className="text-sm mt-1">Be the first to get ranked!</p>
          </div>
        )}
        
        <div className="mt-4 text-center">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/leaderboard')}
            className="w-full text-yellow-500 border-yellow-500/30 hover:bg-yellow-500/10"
          >
            View All Rankings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
