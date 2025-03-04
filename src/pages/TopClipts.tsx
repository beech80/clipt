import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, TrendingUp, Clock, Heart, Eye, MessageSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function TopClipts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('trending');
  const [loading, setLoading] = useState(true);
  const [topClipts, setTopClipts] = useState([]);

  // Mock data for demonstration purposes
  const mockClipts = [
    {
      id: 1,
      title: "Unbelievable play in the final seconds!",
      thumbnail: "https://placehold.co/300x200/333/FFF?text=Gaming+Clip",
      game: "Call of Duty",
      username: "ProGamer123",
      avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix",
      views: 125980,
      likes: 45293,
      comments: 1238,
      createdAt: "2 days ago",
      trending: true,
      weekly: true
    },
    {
      id: 2,
      title: "This strategy breaks the game completely",
      thumbnail: "https://placehold.co/300x200/333/FFF?text=Strategy+Clip",
      game: "League of Legends",
      username: "StrategyMaster",
      avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=John",
      views: 98750,
      likes: 32145,
      comments: 932,
      createdAt: "3 days ago",
      trending: true,
      weekly: false
    },
    {
      id: 3,
      title: "New world record speedrun!",
      thumbnail: "https://placehold.co/300x200/333/FFF?text=Speedrun",
      game: "Minecraft",
      username: "SpeedKing",
      avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Maria",
      views: 78560,
      likes: 28976,
      comments: 756,
      createdAt: "1 week ago",
      trending: false,
      weekly: true
    },
    {
      id: 4,
      title: "Most clutch play of the year",
      thumbnail: "https://placehold.co/300x200/333/FFF?text=Clutch+Moment",
      game: "Valorant",
      username: "ClutchQueen",
      avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Sarah",
      views: 65432,
      likes: 23456,
      comments: 654,
      createdAt: "5 days ago",
      trending: true,
      weekly: true
    },
    {
      id: 5,
      title: "Hilarious glitch compilation",
      thumbnail: "https://placehold.co/300x200/333/FFF?text=Glitches",
      game: "GTA V",
      username: "GlitchHunter",
      avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Alex",
      views: 54321,
      likes: 18765,
      comments: 423,
      createdAt: "1 day ago",
      trending: true,
      weekly: false
    },
    {
      id: 6,
      title: "Best trick shots of the month",
      thumbnail: "https://placehold.co/300x200/333/FFF?text=Trick+Shots",
      game: "Rocket League",
      username: "TrickMaster",
      avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=David",
      views: 43210,
      likes: 15987,
      comments: 321,
      createdAt: "2 weeks ago",
      trending: false,
      weekly: true
    }
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setTopClipts(mockClipts);
      setLoading(false);
    }, 800);
  }, []);

  const filteredClipts = mockClipts.filter(clip => {
    if (activeTab === 'trending') return clip.trending;
    if (activeTab === 'weekly') return clip.weekly;
    return true;
  });

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="h-8 w-8 text-yellow-500" />
        <h1 className="text-3xl font-bold">Top Clipts</h1>
      </div>

      <Tabs defaultValue="trending" className="w-full mb-8" onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="trending" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Trending
          </TabsTrigger>
          <TabsTrigger value="weekly" className="flex items-center gap-2">
            <Clock className="h-4 w-4" /> This Week
          </TabsTrigger>
          <TabsTrigger value="all-time" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" /> All-Time
          </TabsTrigger>
        </TabsList>
        
        {/* Content is the same, just filtered differently based on active tab */}
        <TabsContent value="trending" className="space-y-0">
          <CliptList clips={filteredClipts} loading={loading} navigate={navigate} />
        </TabsContent>
        <TabsContent value="weekly" className="space-y-0">
          <CliptList clips={filteredClipts} loading={loading} navigate={navigate} />
        </TabsContent>
        <TabsContent value="all-time" className="space-y-0">
          <CliptList clips={filteredClipts} loading={loading} navigate={navigate} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Component to display a list of clipts
function CliptList({ clips, loading, navigate }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="overflow-hidden animate-pulse">
            <div className="h-48 bg-gray-700"></div>
            <CardContent className="p-4">
              <div className="h-4 bg-gray-700 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-gray-700 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {clips.map((clip, index) => (
        <motion.div
          key={clip.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <Card 
            className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 bg-[#1A1B26] border-[#272A37] hover:border-[#6366F1]/50"
            onClick={() => navigate(`/clipts/${clip.id}`)}
          >
            <div className="relative">
              <img 
                src={clip.thumbnail} 
                alt={clip.title} 
                className="w-full h-48 object-cover"
              />
              <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded-md text-xs text-white flex items-center">
                <Eye className="h-3 w-3 mr-1" /> {(clip.views / 1000).toFixed(1)}k
              </div>
              <Badge 
                className="absolute top-2 left-2 bg-gradient-to-r from-purple-600 to-blue-600"
              >
                {clip.game}
              </Badge>
            </div>
            <CardContent className="p-4">
              <h3 className="font-bold text-lg mb-2 line-clamp-2 text-white">
                {clip.title}
              </h3>
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={clip.avatarUrl} />
                    <AvatarFallback>{clip.username.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-gray-300">{clip.username}</span>
                </div>
                <div className="text-xs text-gray-400">{clip.createdAt}</div>
              </div>
              <div className="flex mt-3 text-sm text-gray-400 justify-between">
                <span className="flex items-center gap-1">
                  <Heart className="h-3 w-3 text-red-500" /> {(clip.likes / 1000).toFixed(1)}k
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3 text-blue-500" /> {clip.comments}
                </span>
                {index < 3 && (
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
                    #{index + 1}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
