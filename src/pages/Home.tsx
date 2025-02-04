import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import PostList from '@/components/PostList';
import GameBoyControls from '@/components/GameBoyControls';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from 'react-router-dom';
import { FeaturedCarousel } from '@/components/content/FeaturedCarousel';
import { motion } from 'framer-motion';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Featured Carousel Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <FeaturedCarousel />
        </motion.div>

        <div className="mb-6 animate-fade-in">
          <Tabs defaultValue="squads" className="w-full">
            <TabsList className="grid w-full grid-cols-1 p-1 gap-1">
              <div 
                className="gaming-gradient text-2xl font-bold tracking-wider cursor-pointer hover:scale-105 transition-transform flex justify-center items-center"
                onClick={() => navigate('/squads')}
              >
                Squads Clipts
              </div>
            </TabsList>
            
            <TabsContent value="squads" className="mt-4">
              {/* Post List with improved grid layout */}
              <div className="grid gap-6">
                <PostList />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <GameBoyControls />
    </div>
  );
};

export default Home;