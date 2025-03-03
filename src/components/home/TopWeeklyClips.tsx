import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Loader2, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Post as PostType } from '@/types/post';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface TopClip {
  id: string;
  title: string;
  image_url: string | null;
  video_url: string | null;
  vote_count: number;
  user_id: string;
  created_at: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
  games?: {
    name: string;
  } | null;
}

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
    
  }, []);
  
  const { data: topClips, isLoading, error } = useQuery({
    queryKey: ['weekly-top-clips', weekStart, weekEnd],
    queryFn: async () => {
      // Only run the query if we have valid dates
      if (!weekStart || !weekEnd) return [];
      
      console.log(`Fetching top clips from ${weekStart} to ${weekEnd}`);
      
      const { data, error } = await supabase
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
          ),
          vote_count:clip_votes(count)
        `)
        .gte('created_at', `${weekStart}T00:00:00Z`)
        .lte('created_at', `${weekEnd}T23:59:59Z`)
        .order('vote_count', { ascending: false })
        .limit(10);
        
      if (error) {
        console.error('Error fetching top weekly clips:', error);
        throw error;
      }
      
      // Process data to extract vote count
      return data.map(item => ({
        ...item,
        vote_count: item.vote_count?.[0]?.count || 0
      }));
    },
    enabled: Boolean(weekStart && weekEnd),
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
  
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
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
        <CardContent className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="w-full bg-[#1A1F2C]">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Top Weekly Clips
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-6 text-red-400">
          <p>Failed to load top clips</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
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
          <div className="space-y-3">
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
                
                {clip.image_url && (
                  <div className="w-14 h-14 rounded overflow-hidden mr-3 flex-shrink-0">
                    <img 
                      src={clip.image_url} 
                      alt={clip.title || 'Clip thumbnail'} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
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
