import React, { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BackButton } from '@/components/ui/back-button';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Simple structure for top clipts points
interface LeaderboardSpot {
  id: string;
  points: number;
}

const TopClipts = () => {
  const [activeTab, setActiveTab] = useState('daily');
  const [leaderboard, setLeaderboard] = useState<LeaderboardSpot[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data for leaderboard spots
  const mockLeaderboard = [
    { id: '1', points: 9875 },
    { id: '2', points: 8932 },
    { id: '3', points: 7854 },
    { id: '4', points: 7632 },
    { id: '5', points: 6943 },
    { id: '6', points: 6521 },
    { id: '7', points: 5987 },
    { id: '8', points: 5432 },
    { id: '9', points: 4987 },
    { id: '10', points: 4532 },
  ];

  useEffect(() => {
    // Simulate API fetch
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        // Just use mock data for now
        setTimeout(() => {
          setLeaderboard(mockLeaderboard);
          setLoading(false);
        }, 800);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        toast.error('Failed to load leaderboard');
        setLoading(false);
      }
    };

    fetchLeaderboard();
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

  // Function to get background color based on rank
  const getSpotBackground = (rank) => {
    switch(rank) {
      case 1: return 'bg-gradient-to-r from-yellow-900/30 to-yellow-700/20 border-l-4 border-yellow-400';
      case 2: return 'bg-gradient-to-r from-gray-800/30 to-gray-600/20 border-l-4 border-gray-400';
      case 3: return 'bg-gradient-to-r from-amber-900/30 to-amber-700/20 border-l-4 border-amber-700';
      default: return 'bg-gradient-to-r from-indigo-950/40 to-purple-900/30 border-l-4 border-purple-400/50';
    }
  };

  // Function to get glow effect based on rank
  const getSpotGlow = (rank) => {
    switch(rank) {
      case 1: return 'shadow-[0_0_15px_rgba(234,179,8,0.25)]';
      case 2: return 'shadow-[0_0_10px_rgba(156,163,175,0.15)]';
      case 3: return 'shadow-[0_0_10px_rgba(180,83,9,0.15)]';
      default: return '';
    }
  };

  // Function to render the rank number with style
  const renderRankNumber = (rank) => {
    const style = rank <= 3 
      ? 'font-black text-2xl' 
      : 'font-bold text-xl';
      
    return <span className={`${style} text-indigo-300 w-12 inline-block text-center`}>{rank}</span>;
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
      <div className="pt-20 px-4 sm:px-6 md:px-8 max-w-lg mx-auto">
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
                      <div key={i} className="p-3 rounded-md bg-indigo-950/30 flex justify-between items-center">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </div>
                    ))}
                  </div>
                ) : (
                  // List of leaderboard spots
                  <div className="space-y-2 p-3">
                    {leaderboard.map((spot, index) => (
                      <div 
                        key={spot.id} 
                        className={cn(
                          "p-4 rounded-md flex items-center justify-between",
                          getSpotBackground(index + 1),
                          getSpotGlow(index + 1)
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {renderRankNumber(index + 1)}
                          <Trophy className={`h-6 w-6 ${getMedalColor(index + 1)}`} />
                        </div>
                        
                        <div className="flex items-center gap-1 bg-indigo-900/40 px-4 py-1.5 rounded-full">
                          <Trophy className="h-4 w-4 text-yellow-400" />
                          <span className="text-base font-bold text-indigo-200">
                            {spot.points.toLocaleString()}
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
                      <div key={i} className="p-3 rounded-md bg-indigo-950/30 flex justify-between items-center">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </div>
                    ))}
                  </div>
                ) : (
                  // Same leaderboard structure for weekly tab
                  <div className="space-y-2 p-3">
                    {leaderboard.map((spot, index) => (
                      <div 
                        key={spot.id} 
                        className={cn(
                          "p-4 rounded-md flex items-center justify-between",
                          getSpotBackground(index + 1),
                          getSpotGlow(index + 1)
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {renderRankNumber(index + 1)}
                          <Trophy className={`h-6 w-6 ${getMedalColor(index + 1)}`} />
                        </div>
                        
                        <div className="flex items-center gap-1 bg-indigo-900/40 px-4 py-1.5 rounded-full">
                          <Trophy className="h-4 w-4 text-yellow-400" />
                          <span className="text-base font-bold text-indigo-200">
                            {spot.points.toLocaleString()}
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
                      <div key={i} className="p-3 rounded-md bg-indigo-950/30 flex justify-between items-center">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </div>
                    ))}
                  </div>
                ) : (
                  // Same leaderboard structure for all-time tab
                  <div className="space-y-2 p-3">
                    {leaderboard.map((spot, index) => (
                      <div 
                        key={spot.id} 
                        className={cn(
                          "p-4 rounded-md flex items-center justify-between",
                          getSpotBackground(index + 1),
                          getSpotGlow(index + 1)
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {renderRankNumber(index + 1)}
                          <Trophy className={`h-6 w-6 ${getMedalColor(index + 1)}`} />
                        </div>
                        
                        <div className="flex items-center gap-1 bg-indigo-900/40 px-4 py-1.5 rounded-full">
                          <Trophy className="h-4 w-4 text-yellow-400" />
                          <span className="text-base font-bold text-indigo-200">
                            {spot.points.toLocaleString()}
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
