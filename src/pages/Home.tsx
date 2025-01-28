import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import PostList from '@/components/PostList';
import GameBoyControls from '@/components/GameBoyControls';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from 'react-router-dom';
import { Camera, Users, Gamepad } from 'lucide-react';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-[#1A1F2C] overflow-hidden">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-[#1A1F2C] shadow-lg rounded-lg mb-4 p-4 animate-fade-in">
          <Tabs defaultValue="squads" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-[#222632] rounded-lg p-1 gap-1">
              <TabsTrigger 
                value="squads" 
                className="flex items-center justify-center gap-2 text-sm font-medium transition-all duration-300 data-[state=active]:bg-[#2A2F3C] data-[state=active]:text-white rounded-md px-4 py-2 hover:bg-[#2A2F3C]/50"
                onClick={() => navigate('/squads')}
              >
                <Users className="w-4 h-4" />
                Squads
              </TabsTrigger>
              <TabsTrigger 
                value="clipts" 
                className="flex items-center justify-center gap-2 text-sm font-medium transition-all duration-300 data-[state=active]:bg-[#2A2F3C] data-[state=active]:text-white rounded-md px-4 py-2 hover:bg-[#2A2F3C]/50"
                onClick={() => navigate('/clipts')}
              >
                <Gamepad className="w-4 h-4" />
                Clipts
              </TabsTrigger>
              <TabsTrigger 
                value="post" 
                className="flex items-center justify-center gap-2 text-sm font-medium transition-all duration-300 data-[state=active]:bg-[#2A2F3C] data-[state=active]:text-white rounded-md px-4 py-2 hover:bg-[#2A2F3C]/50"
                onClick={() => navigate('/posts/new')}
              >
                <Camera className="w-4 h-4" />
                Post
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="squads" className="mt-2 animate-fade-in">
              <div className="text-sm text-gray-400">
                {!user ? "Sign in to join squads and share clips!" : "Join squads to team up with other players!"}
              </div>
            </TabsContent>
            
            <TabsContent value="clipts" className="mt-2 animate-fade-in">
              <div className="text-sm text-gray-400">
                {!user ? "Sign in to share and view clips!" : "Share your best gaming moments!"}
              </div>
            </TabsContent>

            <TabsContent value="post" className="mt-2 animate-fade-in">
              <div className="text-sm text-gray-400">
                {!user ? "Sign in to create posts!" : "Share your gaming experiences!"}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Instagram-style Feed */}
        <div className="post-container relative">
          <PostList />
        </div>
      </div>

      {/* Game Boy Controls */}
      <GameBoyControls />
    </div>
  );
};

export default Home;