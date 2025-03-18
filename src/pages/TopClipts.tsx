import React, { useState } from 'react';
import { Trophy, Medal, Award, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const TopClipts = () => {
  const [activeTab, setActiveTab] = useState('daily');

  // Mock data for top boarders
  const topBoarders = [
    { id: 1, username: "ProGamer123", score: 9875, avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix" },
    { id: 2, username: "GamingLegend", score: 8932, avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=John" },
    { id: 3, username: "PixelQueen", score: 7854, avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Maria" },
    { id: 4, username: "GameMaster64", score: 7632, avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Sarah" },
    { id: 5, username: "TwitchKing", score: 6943, avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Alex" },
    { id: 6, username: "StreamWizard", score: 6521, avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=David" },
    { id: 7, username: "GameHero99", score: 5987, avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Mike" },
    { id: 8, username: "ViralGamer", score: 5432, avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Lisa" },
    { id: 9, username: "CliptChamp", score: 4987, avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Dan" },
    { id: 10, username: "EpicStreamer", score: 4532, avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Emma" },
  ];

  // Function to get the appropriate rank icon
  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 1: return <Medal className="h-5 w-5 text-gray-300" />;
      case 2: return <Medal className="h-5 w-5 text-amber-600" />;
      default: return <Award className="h-5 w-5 text-purple-400" />;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <Trophy className="h-8 w-8 text-yellow-500" />
        <h1 className="text-3xl font-bold">Leaderboard</h1>
      </div>

      <Tabs defaultValue="daily" className="w-full mb-8" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="all-time">All-Time</TabsTrigger>
        </TabsList>
      
        <TabsContent value="daily">
          <Card className="bg-black/40 border-purple-900/40">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Top 10 Creators
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-purple-900/20">
                {topBoarders.map((boarder, index) => (
                  <li key={boarder.id} className="flex items-center justify-between p-4 hover:bg-purple-950/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-lg font-bold w-6 text-center text-muted-foreground">
                        {index + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        {getRankIcon(index)}
                        <Avatar className="h-8 w-8 border border-purple-400/20">
                          <AvatarImage src={boarder.avatarUrl} />
                          <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                        </Avatar>
                        <span className="font-semibold">{boarder.username}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-purple-950/30 text-purple-300">
                      {boarder.score.toLocaleString()} pts
                    </Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="weekly">
          <Card className="bg-black/40 border-purple-900/40">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Top 10 Creators
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-purple-900/20">
                {topBoarders.map((boarder, index) => (
                  <li key={boarder.id} className="flex items-center justify-between p-4 hover:bg-purple-950/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-lg font-bold w-6 text-center text-muted-foreground">
                        {index + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        {getRankIcon(index)}
                        <Avatar className="h-8 w-8 border border-purple-400/20">
                          <AvatarImage src={boarder.avatarUrl} />
                          <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                        </Avatar>
                        <span className="font-semibold">{boarder.username}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-purple-950/30 text-purple-300">
                      {boarder.score.toLocaleString()} pts
                    </Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="all-time">
          <Card className="bg-black/40 border-purple-900/40">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Top 10 Creators
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-purple-900/20">
                {topBoarders.map((boarder, index) => (
                  <li key={boarder.id} className="flex items-center justify-between p-4 hover:bg-purple-950/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-lg font-bold w-6 text-center text-muted-foreground">
                        {index + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        {getRankIcon(index)}
                        <Avatar className="h-8 w-8 border border-purple-400/20">
                          <AvatarImage src={boarder.avatarUrl} />
                          <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                        </Avatar>
                        <span className="font-semibold">{boarder.username}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-purple-950/30 text-purple-300">
                      {boarder.score.toLocaleString()} pts
                    </Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TopClipts;
