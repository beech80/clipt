import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import PostList from '@/components/PostList';
import GameBoyControls from '@/components/GameBoyControls';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="relative min-h-screen bg-[#1A1F2C] overflow-hidden">
      {/* Game Boy Frame */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="gaming-cartridge mb-4 p-4">
          <Tabs defaultValue="squads" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="squads" className="text-xl font-bold gaming-gradient">Squads</TabsTrigger>
              <TabsTrigger value="clipts" className="text-xl font-bold gaming-gradient">Clipts</TabsTrigger>
            </TabsList>
            
            <TabsContent value="squads">
              <div className="text-sm text-gaming-400 mt-2">
                {!user ? "Sign in to join squads and share clips!" : "Join squads to team up with other players!"}
              </div>
            </TabsContent>
            
            <TabsContent value="clipts">
              <div className="text-sm text-gaming-400 mt-2">
                {!user ? "Sign in to share and view clips!" : "Share your best gaming moments!"}
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