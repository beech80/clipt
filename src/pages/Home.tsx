import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import PostList from '@/components/PostList';
import GameBoyControls from '@/components/GameBoyControls';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="mb-4 p-4 animate-fade-in">
          <Tabs defaultValue="squads" className="w-full">
            <TabsList className="grid w-full grid-cols-1 p-1 gap-1">
              <TabsTrigger 
                value="squads" 
                className="flex items-center justify-center gap-2 text-sm font-medium transition-all duration-300 data-[state=active]:text-white rounded-md px-4 py-2"
                onClick={() => navigate('/squads')}
              >
                Squads Clipts
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="squads" className="mt-2 animate-fade-in">
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