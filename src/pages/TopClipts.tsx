import React, { useState, useEffect } from 'react';
import { Trophy, ThumbsUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BackButton } from '@/components/ui/back-button';
import { supabase } from '@/lib/supabase';
import { Post } from '@/types/post';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

// Define the structure for a clipt with votes/likes
interface TopClipt {
  id: string;
  title: string;
  content: string;
  video_url: string;
  created_at: string;
  like_count: number;
  user_id: string;
  username: string;
  avatar_url: string;
  game_name?: string;
}

const TopClipts = () => {
  const [activeTab, setActiveTab] = useState('daily');
  const [topClipts, setTopClipts] = useState<TopClipt[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data for top clipts (we'd replace this with actual DB fetch)
  const mockTopClipts = [
    {
      id: '1',
      title: 'Amazing 360 no-scope!',
      content: 'Check out this incredible shot I made in the tournament finals',
      video_url: 'https://example.com/video1.mp4',
      created_at: '2025-03-10T15:30:00Z',
      like_count: 986,
      user_id: 'user1',
      username: 'ProGamer123',
      avatar_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix',
      game_name: 'Call of Duty'
    },
    {
      id: '2',
      title: 'Epic clutch play in 1v5',
      content: 'My team was down and I had to make this happen',
      video_url: 'https://example.com/video2.mp4',
      created_at: '2025-03-11T12:15:00Z',
      like_count: 875,
      user_id: 'user2',
      username: 'GamingLegend',
      avatar_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=John',
      game_name: 'Valorant'
    },
    {
      id: '3',
      title: 'Glitch exploit discovered!',
      content: 'Found this crazy new exploit - devs will patch soon',
      video_url: 'https://example.com/video3.mp4',
      created_at: '2025-03-12T09:45:00Z',
      like_count: 743, 
      user_id: 'user3',
      username: 'PixelQueen',
      avatar_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Maria',
      game_name: 'Minecraft'
    },
    {
      id: '4',
      title: 'New speedrun world record',
      content: 'Just broke the previous record by 12 seconds!',
      video_url: 'https://example.com/video4.mp4',
      created_at: '2025-03-13T18:20:00Z',
      like_count: 698,
      user_id: 'user4',
      username: 'GameMaster64',
      avatar_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Sarah',
      game_name: 'Elden Ring'
    },
    {
      id: '5',
      title: 'Funniest fail of the week',
      content: 'Tried to be cool but then this happened...',
      video_url: 'https://example.com/video5.mp4',
      created_at: '2025-03-14T14:10:00Z',
      like_count: 612,
      user_id: 'user5',
      username: 'TwitchKing',
      avatar_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Alex',
      game_name: 'Fortnite'
    }
  ];

  useEffect(() => {
    // Simulate API fetch
    const fetchTopClipts = async () => {
      setLoading(true);
      try {
        // In a real implementation, we would fetch from Supabase
        // const { data, error } = await supabase
        //   .from('posts')
        //   .select('*, profiles(username, avatar_url)')
        //   .order('like_count', { ascending: false })
        //   .limit(10);
        
        // if (error) throw error;
        
        // Just use mock data for now
        setTimeout(() => {
          setTopClipts(mockTopClipts);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching top clipts:', error);
        toast.error('Failed to load top clipts');
        setLoading(false);
      }
    };

    fetchTopClipts();
  }, [activeTab]); // Refetch when tab changes

  // Function to get medal color based on rank
  const getMedalColor = (rank) => {
    switch(rank) {
      case 1: return 'text-yellow-400'; // Gold
      case 2: return 'text-gray-400'; // Silver
      case 3: return 'text-amber-700'; // Bronze
      default: return 'text-purple-400'; // Purple for others
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 to-black text-white pb-20">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-gradient-to-r from-indigo-950 to-purple-900 backdrop-blur-md border-b border-indigo-800 shadow-lg">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <BackButton />
          <div className="flex items-center">
            <span className="text-yellow-400 mr-2">
              <Trophy className="h-6 w-6" />
            </span>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-300 to-purple-400 bg-clip-text text-transparent">Top Clipts</h1>
          </div>
          <div className="w-10"></div> {/* Empty div for spacing */}
        </div>
      </div>

      {/* Main content with padding for fixed header */}
      <div className="pt-20 px-4 sm:px-6 md:px-8 max-w-4xl mx-auto">
        {/* Tabs */}
        <div className="flex justify-center mb-6">
          <Tabs defaultValue="daily" className="w-full max-w-md" onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 bg-indigo-950/50 border border-indigo-800/30">
              <TabsTrigger value="daily" className="data-[state=active]:bg-indigo-700 data-[state=active]:text-white">Daily</TabsTrigger>
              <TabsTrigger value="weekly" className="data-[state=active]:bg-indigo-700 data-[state=active]:text-white">Weekly</TabsTrigger>
              <TabsTrigger value="all-time" className="data-[state=active]:bg-indigo-700 data-[state=active]:text-white">All-Time</TabsTrigger>
            </TabsList>

            {/* Daily top clipts */}
            <TabsContent value="daily" className="mt-6">
              <div className="bg-black/40 border border-indigo-900/30 rounded-lg overflow-hidden">
                <div className="p-4 pb-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="h-5 w-5 text-yellow-400" />
                    <h2 className="text-xl font-bold text-indigo-300">Top 10 Clipts</h2>
                  </div>
                </div>
                
                {loading ? (
                  // Loading skeletons
                  <div className="divide-y divide-indigo-900/20">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-32 w-full rounded-md" />
                      </div>
                    ))}
                  </div>
                ) : (
                  // List of top clipts
                  <div className="divide-y divide-indigo-900/20">
                    {topClipts.map((clipt, index) => (
                      <div key={clipt.id} className="p-4 hover:bg-indigo-950/30 transition-colors">
                        <div className="flex items-start gap-2">
                          {/* Rank */}
                          <div className="flex flex-col items-center mr-1 pt-1">
                            <span className="text-indigo-400 w-5 text-center font-mono">{index + 1}</span>
                            <Trophy className={`h-4 w-4 mt-1 ${getMedalColor(index + 1)}`} />
                          </div>
                          
                          {/* Clipt content - simplified version */}
                          <div className="flex-1">
                            {/* User info */}
                            <div className="flex items-center mb-2">
                              <Avatar className="h-6 w-6 border border-indigo-700/30 mr-2">
                                <AvatarImage src={clipt.avatar_url} alt={clipt.username} />
                                <AvatarFallback>{clipt.username.substring(0, 2)}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-sm text-indigo-100">{clipt.username}</span>
                              {clipt.game_name && (
                                <span className="ml-2 text-xs bg-indigo-900/40 px-2 py-0.5 rounded-full text-indigo-300">
                                  {clipt.game_name}
                                </span>
                              )}
                            </div>
                            
                            {/* Title and content */}
                            <h3 className="font-semibold text-white mb-1">{clipt.title}</h3>
                            <p className="text-sm text-indigo-200 mb-2">{clipt.content}</p>
                            
                            {/* Video placeholder */}
                            <div className="bg-indigo-950/30 h-32 rounded-md flex items-center justify-center mb-2">
                              <span className="text-indigo-400 text-sm">Video preview</span>
                            </div>
                            
                            {/* Like count */}
                            <div className="flex items-center text-sm text-indigo-400">
                              <ThumbsUp className="h-3.5 w-3.5 mr-1" />
                              <span>{clipt.like_count.toLocaleString()} votes</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* Weekly top clipts - same structure as daily */}
            <TabsContent value="weekly" className="mt-6">
              <div className="bg-black/40 border border-indigo-900/30 rounded-lg overflow-hidden">
                <div className="p-4 pb-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="h-5 w-5 text-yellow-400" />
                    <h2 className="text-xl font-bold text-indigo-300">Top 10 Clipts</h2>
                  </div>
                </div>
                
                {loading ? (
                  // Loading skeletons (same as daily)
                  <div className="divide-y divide-indigo-900/20">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-32 w-full rounded-md" />
                      </div>
                    ))}
                  </div>
                ) : (
                  // Same clipt list structure for weekly tab
                  <div className="divide-y divide-indigo-900/20">
                    {topClipts.map((clipt, index) => (
                      <div key={clipt.id} className="p-4 hover:bg-indigo-950/30 transition-colors">
                        <div className="flex items-start gap-2">
                          <div className="flex flex-col items-center mr-1 pt-1">
                            <span className="text-indigo-400 w-5 text-center font-mono">{index + 1}</span>
                            <Trophy className={`h-4 w-4 mt-1 ${getMedalColor(index + 1)}`} />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <Avatar className="h-6 w-6 border border-indigo-700/30 mr-2">
                                <AvatarImage src={clipt.avatar_url} alt={clipt.username} />
                                <AvatarFallback>{clipt.username.substring(0, 2)}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-sm text-indigo-100">{clipt.username}</span>
                              {clipt.game_name && (
                                <span className="ml-2 text-xs bg-indigo-900/40 px-2 py-0.5 rounded-full text-indigo-300">
                                  {clipt.game_name}
                                </span>
                              )}
                            </div>
                            
                            <h3 className="font-semibold text-white mb-1">{clipt.title}</h3>
                            <p className="text-sm text-indigo-200 mb-2">{clipt.content}</p>
                            
                            <div className="bg-indigo-950/30 h-32 rounded-md flex items-center justify-center mb-2">
                              <span className="text-indigo-400 text-sm">Video preview</span>
                            </div>
                            
                            <div className="flex items-center text-sm text-indigo-400">
                              <ThumbsUp className="h-3.5 w-3.5 mr-1" />
                              <span>{clipt.like_count.toLocaleString()} votes</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* All-time top clipts - same structure */}
            <TabsContent value="all-time" className="mt-6">
              <div className="bg-black/40 border border-indigo-900/30 rounded-lg overflow-hidden">
                <div className="p-4 pb-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="h-5 w-5 text-yellow-400" />
                    <h2 className="text-xl font-bold text-indigo-300">Top 10 Clipts</h2>
                  </div>
                </div>
                
                {loading ? (
                  // Loading skeletons (same as others)
                  <div className="divide-y divide-indigo-900/20">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-32 w-full rounded-md" />
                      </div>
                    ))}
                  </div>
                ) : (
                  // Same clipt list structure for all-time tab
                  <div className="divide-y divide-indigo-900/20">
                    {topClipts.map((clipt, index) => (
                      <div key={clipt.id} className="p-4 hover:bg-indigo-950/30 transition-colors">
                        <div className="flex items-start gap-2">
                          <div className="flex flex-col items-center mr-1 pt-1">
                            <span className="text-indigo-400 w-5 text-center font-mono">{index + 1}</span>
                            <Trophy className={`h-4 w-4 mt-1 ${getMedalColor(index + 1)}`} />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <Avatar className="h-6 w-6 border border-indigo-700/30 mr-2">
                                <AvatarImage src={clipt.avatar_url} alt={clipt.username} />
                                <AvatarFallback>{clipt.username.substring(0, 2)}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-sm text-indigo-100">{clipt.username}</span>
                              {clipt.game_name && (
                                <span className="ml-2 text-xs bg-indigo-900/40 px-2 py-0.5 rounded-full text-indigo-300">
                                  {clipt.game_name}
                                </span>
                              )}
                            </div>
                            
                            <h3 className="font-semibold text-white mb-1">{clipt.title}</h3>
                            <p className="text-sm text-indigo-200 mb-2">{clipt.content}</p>
                            
                            <div className="bg-indigo-950/30 h-32 rounded-md flex items-center justify-center mb-2">
                              <span className="text-indigo-400 text-sm">Video preview</span>
                            </div>
                            
                            <div className="flex items-center text-sm text-indigo-400">
                              <ThumbsUp className="h-3.5 w-3.5 mr-1" />
                              <span>{clipt.like_count.toLocaleString()} votes</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default TopClipts;
