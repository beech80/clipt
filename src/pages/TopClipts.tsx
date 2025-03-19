import React, { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BackButton } from '@/components/ui/back-button';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Simplified structure for top clipts
interface TopClipt {
  id: string;
  title: string;
  points: number;
  username: string;
  avatar_url: string;
}

const TopClipts = () => {
  const [activeTab, setActiveTab] = useState('daily');
  const [topClipts, setTopClipts] = useState<TopClipt[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data for top clipts
  const mockTopClipts = [
    { id: '1', title: 'Amazing 360 no-scope!', points: 9875, username: 'ProGamer123', avatar_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix' },
    { id: '2', title: 'Epic clutch play in 1v5', points: 8932, username: 'GamingLegend', avatar_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=John' },
    { id: '3', title: 'Glitch exploit discovered!', points: 7854, username: 'PixelQueen', avatar_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Maria' },
    { id: '4', title: 'New speedrun world record', points: 7632, username: 'GameMaster64', avatar_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Sarah' },
    { id: '5', title: 'Funniest fail of the week', points: 6943, username: 'TwitchKing', avatar_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Alex' },
    { id: '6', title: 'Perfect timing combo execution', points: 6521, username: 'StreamWizard', avatar_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=David' },
    { id: '7', title: 'Unbelievable comeback victory', points: 5987, username: 'GameHero99', avatar_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Mike' },
    { id: '8', title: 'Hilarious NPC interaction', points: 5432, username: 'ViralGamer', avatar_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Lisa' },
    { id: '9', title: 'Best squad play of the month', points: 4987, username: 'CliptChamp', avatar_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Dan' },
    { id: '10', title: 'Mind-blowing strategy reveal', points: 4532, username: 'EpicStreamer', avatar_url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Emma' },
  ];

  useEffect(() => {
    // Simulate API fetch
    const fetchTopClipts = async () => {
      setLoading(true);
      try {
        // Just use mock data for now
        setTimeout(() => {
          setTopClipts(mockTopClipts);
          setLoading(false);
        }, 800);
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

  // Function to get background glow based on rank
  const getRankingStyle = (rank) => {
    switch(rank) {
      case 1: return 'bg-gradient-to-r from-yellow-900/20 to-yellow-500/20 border-l-4 border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)]';
      case 2: return 'bg-gradient-to-r from-gray-900/20 to-gray-400/20 border-l-4 border-gray-400 shadow-[0_0_10px_rgba(156,163,175,0.2)]';
      case 3: return 'bg-gradient-to-r from-amber-900/20 to-amber-700/20 border-l-4 border-amber-700 shadow-[0_0_10px_rgba(180,83,9,0.2)]';
      default: return 'bg-gradient-to-r from-indigo-950/30 to-purple-900/20 border-l-4 border-purple-400/50';
    }
  };

  // Function to render the rank number with style
  const renderRankNumber = (rank) => {
    const style = rank <= 3 
      ? 'font-black text-xl' 
      : 'font-bold';
      
    return <span className={`${style} text-indigo-300 w-8 text-center`}>{rank}</span>;
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
      <div className="pt-20 px-4 sm:px-6 md:px-8 max-w-2xl mx-auto">
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
                <div className="p-4 pb-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Trophy className="h-6 w-6 text-yellow-400" />
                    <h2 className="text-xl font-bold text-indigo-300">Top 10 Clipts</h2>
                  </div>
                </div>
                
                {loading ? (
                  // Loading skeletons
                  <div className="space-y-3 p-3">
                    {[...Array(10)].map((_, i) => (
                      <div key={i} className="p-3 rounded-md bg-indigo-950/30">
                        <div className="flex items-center gap-3 mb-2">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <Skeleton className="h-5 w-32" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // List of top clipts with enhanced styling
                  <div className="space-y-2 p-3">
                    {topClipts.map((clipt, index) => (
                      <div 
                        key={clipt.id} 
                        className={cn(
                          "p-3 rounded-md transition-all hover:bg-indigo-900/20 flex items-center justify-between",
                          getRankingStyle(index + 1)
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {/* Rank number */}
                          {renderRankNumber(index + 1)}
                          
                          {/* Trophy icon */}
                          <Trophy className={`h-5 w-5 ${getMedalColor(index + 1)}`} />
                          
                          {/* User avatar */}
                          <Avatar className="h-8 w-8 border border-indigo-700/30">
                            <AvatarImage src={clipt.avatar_url} alt={clipt.username} />
                            <AvatarFallback>{clipt.username.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                          
                          {/* Username */}
                          <span className="font-semibold text-indigo-100">{clipt.username}</span>
                        </div>
                        
                        {/* Points with trophy icon */}
                        <div className="flex items-center gap-1 bg-indigo-900/40 px-3 py-1 rounded-full">
                          <Trophy className="h-3.5 w-3.5 text-yellow-400" />
                          <span className="text-sm font-semibold text-indigo-200">
                            {clipt.points.toLocaleString()}
                          </span>
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
                <div className="p-4 pb-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Trophy className="h-6 w-6 text-yellow-400" />
                    <h2 className="text-xl font-bold text-indigo-300">Top 10 Clipts</h2>
                  </div>
                </div>
                
                {loading ? (
                  // Loading skeletons (same as daily)
                  <div className="space-y-3 p-3">
                    {[...Array(10)].map((_, i) => (
                      <div key={i} className="p-3 rounded-md bg-indigo-950/30">
                        <div className="flex items-center gap-3 mb-2">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <Skeleton className="h-5 w-32" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Same clipt list structure for weekly tab
                  <div className="space-y-2 p-3">
                    {topClipts.map((clipt, index) => (
                      <div 
                        key={clipt.id} 
                        className={cn(
                          "p-3 rounded-md transition-all hover:bg-indigo-900/20 flex items-center justify-between",
                          getRankingStyle(index + 1)
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {renderRankNumber(index + 1)}
                          <Trophy className={`h-5 w-5 ${getMedalColor(index + 1)}`} />
                          <Avatar className="h-8 w-8 border border-indigo-700/30">
                            <AvatarImage src={clipt.avatar_url} alt={clipt.username} />
                            <AvatarFallback>{clipt.username.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                          <span className="font-semibold text-indigo-100">{clipt.username}</span>
                        </div>
                        <div className="flex items-center gap-1 bg-indigo-900/40 px-3 py-1 rounded-full">
                          <Trophy className="h-3.5 w-3.5 text-yellow-400" />
                          <span className="text-sm font-semibold text-indigo-200">
                            {clipt.points.toLocaleString()}
                          </span>
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
                <div className="p-4 pb-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Trophy className="h-6 w-6 text-yellow-400" />
                    <h2 className="text-xl font-bold text-indigo-300">Top 10 Clipts</h2>
                  </div>
                </div>
                
                {loading ? (
                  // Loading skeletons (same as others)
                  <div className="space-y-3 p-3">
                    {[...Array(10)].map((_, i) => (
                      <div key={i} className="p-3 rounded-md bg-indigo-950/30">
                        <div className="flex items-center gap-3 mb-2">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <Skeleton className="h-5 w-32" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Same clipt list structure for all-time tab
                  <div className="space-y-2 p-3">
                    {topClipts.map((clipt, index) => (
                      <div 
                        key={clipt.id} 
                        className={cn(
                          "p-3 rounded-md transition-all hover:bg-indigo-900/20 flex items-center justify-between",
                          getRankingStyle(index + 1)
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {renderRankNumber(index + 1)}
                          <Trophy className={`h-5 w-5 ${getMedalColor(index + 1)}`} />
                          <Avatar className="h-8 w-8 border border-indigo-700/30">
                            <AvatarImage src={clipt.avatar_url} alt={clipt.username} />
                            <AvatarFallback>{clipt.username.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                          <span className="font-semibold text-indigo-100">{clipt.username}</span>
                        </div>
                        <div className="flex items-center gap-1 bg-indigo-900/40 px-3 py-1 rounded-full">
                          <Trophy className="h-3.5 w-3.5 text-yellow-400" />
                          <span className="text-sm font-semibold text-indigo-200">
                            {clipt.points.toLocaleString()}
                          </span>
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
