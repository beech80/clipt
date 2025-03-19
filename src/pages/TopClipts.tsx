import React, { useState } from 'react';
import { Trophy } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BackButton } from '@/components/ui/back-button';

const TopClipts = () => {
  const [activeTab, setActiveTab] = useState('daily');

  // Mock data for top creators
  const topCreators = [
    { id: 1, username: "ProGamer123", points: 9875, avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix" },
    { id: 2, username: "GamingLegend", points: 8932, avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=John" },
    { id: 3, username: "PixelQueen", points: 7854, avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Maria" },
    { id: 4, username: "GameMaster64", points: 7632, avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Sarah" },
    { id: 5, username: "TwitchKing", points: 6943, avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Alex" },
    { id: 6, username: "StreamWizard", points: 6521, avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=David" },
    { id: 7, username: "GameHero99", points: 5987, avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Mike" },
    { id: 8, username: "ViralGamer", points: 5432, avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Lisa" },
    { id: 9, username: "CliptChamp", points: 4987, avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Dan" },
    { id: 10, username: "EpicStreamer", points: 4532, avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Emma" },
  ];

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
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-300 to-purple-400 bg-clip-text text-transparent">Leaderboard</h1>
          </div>
          <div className="w-10"></div> {/* Empty div for spacing */}
        </div>
      </div>

      {/* Main content with padding for fixed header */}
      <div className="pt-20 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
        {/* Tabs */}
        <div className="flex justify-center mb-6">
          <Tabs defaultValue="daily" className="w-full max-w-md" onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 bg-indigo-950/50 border border-indigo-800/30">
              <TabsTrigger value="daily" className="data-[state=active]:bg-indigo-700 data-[state=active]:text-white">Daily</TabsTrigger>
              <TabsTrigger value="weekly" className="data-[state=active]:bg-indigo-700 data-[state=active]:text-white">Weekly</TabsTrigger>
              <TabsTrigger value="all-time" className="data-[state=active]:bg-indigo-700 data-[state=active]:text-white">All-Time</TabsTrigger>
            </TabsList>

            {/* Content for all tabs - similar UI */}
            <TabsContent value="daily" className="mt-6">
              <div className="bg-black/40 border border-indigo-900/30 rounded-lg overflow-hidden">
                <div className="p-4 pb-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="h-5 w-5 text-yellow-400" />
                    <h2 className="text-xl font-bold text-indigo-300">Top 10 Creators</h2>
                  </div>
                </div>
                
                <div className="divide-y divide-indigo-900/20">
                  {topCreators.map((creator, index) => (
                    <div key={creator.id} className="flex items-center justify-between p-4 hover:bg-indigo-950/30 transition-colors">
                      <div className="flex items-center">
                        <span className="text-indigo-400 w-8 text-center font-mono">{index + 1}</span>
                        
                        {/* Medal for rank */}
                        <Trophy className={`h-5 w-5 mx-2 ${getMedalColor(index + 1)}`} />
                        
                        <Avatar className="h-8 w-8 border border-indigo-700/30 mr-3">
                          <AvatarImage src={creator.avatarUrl} alt={creator.username} />
                          <AvatarFallback>{creator.username.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        
                        <span className="font-semibold text-indigo-100">{creator.username}</span>
                      </div>
                      
                      <span className="text-sm font-semibold bg-indigo-900/30 px-3 py-1 rounded-full text-indigo-300">
                        {creator.points.toLocaleString()} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="weekly" className="mt-6">
              <div className="bg-black/40 border border-indigo-900/30 rounded-lg overflow-hidden">
                <div className="p-4 pb-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="h-5 w-5 text-yellow-400" />
                    <h2 className="text-xl font-bold text-indigo-300">Top 10 Creators</h2>
                  </div>
                </div>
                
                <div className="divide-y divide-indigo-900/20">
                  {topCreators.map((creator, index) => (
                    <div key={creator.id} className="flex items-center justify-between p-4 hover:bg-indigo-950/30 transition-colors">
                      <div className="flex items-center">
                        <span className="text-indigo-400 w-8 text-center font-mono">{index + 1}</span>
                        
                        {/* Medal for rank */}
                        <Trophy className={`h-5 w-5 mx-2 ${getMedalColor(index + 1)}`} />
                        
                        <Avatar className="h-8 w-8 border border-indigo-700/30 mr-3">
                          <AvatarImage src={creator.avatarUrl} alt={creator.username} />
                          <AvatarFallback>{creator.username.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        
                        <span className="font-semibold text-indigo-100">{creator.username}</span>
                      </div>
                      
                      <span className="text-sm font-semibold bg-indigo-900/30 px-3 py-1 rounded-full text-indigo-300">
                        {creator.points.toLocaleString()} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="all-time" className="mt-6">
              <div className="bg-black/40 border border-indigo-900/30 rounded-lg overflow-hidden">
                <div className="p-4 pb-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="h-5 w-5 text-yellow-400" />
                    <h2 className="text-xl font-bold text-indigo-300">Top 10 Creators</h2>
                  </div>
                </div>
                
                <div className="divide-y divide-indigo-900/20">
                  {topCreators.map((creator, index) => (
                    <div key={creator.id} className="flex items-center justify-between p-4 hover:bg-indigo-950/30 transition-colors">
                      <div className="flex items-center">
                        <span className="text-indigo-400 w-8 text-center font-mono">{index + 1}</span>
                        
                        {/* Medal for rank */}
                        <Trophy className={`h-5 w-5 mx-2 ${getMedalColor(index + 1)}`} />
                        
                        <Avatar className="h-8 w-8 border border-indigo-700/30 mr-3">
                          <AvatarImage src={creator.avatarUrl} alt={creator.username} />
                          <AvatarFallback>{creator.username.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        
                        <span className="font-semibold text-indigo-100">{creator.username}</span>
                      </div>
                      
                      <span className="text-sm font-semibold bg-indigo-900/30 px-3 py-1 rounded-full text-indigo-300">
                        {creator.points.toLocaleString()} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default TopClipts;
