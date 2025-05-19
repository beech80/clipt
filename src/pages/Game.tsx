import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { Gamepad2, Users, Trophy, Clock, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/components/ui/use-toast';
import GameBoyControls from "@/components/GameBoyControls";

const Game = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a237e] to-[#0d1b3c]">
      <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-black/40 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center justify-center max-w-7xl mx-auto relative">
          <BackButton />
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Gamepad2 className="text-purple-400" size={24} />
            Game Details
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-24 pb-20 max-w-2xl">
        {/* Game Header */}
        <div className="bg-black/30 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 shadow-xl mb-6">
          <div className="h-40 bg-gray-800 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-gray-400">Game Banner</p>
            </div>
          </div>
          
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Game {id}</h2>
                <p className="text-gray-400 mt-1">Developer • Publisher</p>
                
                <div className="flex mt-4 space-x-4">
                  <div className="flex items-center text-gray-300">
                    <Users className="mr-2 h-4 w-4 text-purple-400" />
                    <span className="text-sm">10.2K players</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <Trophy className="mr-2 h-4 w-4 text-purple-400" />
                    <span className="text-sm">42 tournaments</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <Clock className="mr-2 h-4 w-4 text-purple-400" />
                    <span className="text-sm">Released 2023</span>
                  </div>
                </div>
              </div>
              
              <Button
                className="bg-purple-600 hover:bg-purple-700 text-white"
                size="sm"
              >
                Follow
              </Button>
            </div>
            
            <div className="mt-6">
              <h3 className="text-lg font-medium text-white mb-2">About</h3>
              <p className="text-gray-300">
                This is a sample description for Game {id}. Here we would display information about the game, including its 
                genre, gameplay features, and other relevant details that would interest players.
              </p>
            </div>
          </div>
        </div>
        
        {/* Clipts Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">Recent Clipts</h3>
            <Button
              variant="link"
              className="text-purple-400 hover:text-purple-300 p-0"
              onClick={() => navigate(`/clipts?game=${id}`)}
            >
              View All
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((item) => (
              <div 
                key={item} 
                className="bg-black/30 backdrop-blur-sm rounded-lg overflow-hidden border border-white/10 cursor-pointer hover:border-purple-500/50 transition-colors"
                onClick={() => navigate(`/post/${item}`)}
              >
                <div className="aspect-video bg-gray-800 flex items-center justify-center">
                  <p className="text-gray-400 text-sm">Clipt Thumbnail</p>
                </div>
                <div className="p-2">
                  <p className="text-white text-sm font-medium truncate">Amazing gameplay moment #{item}</p>
                  <p className="text-gray-400 text-xs">2 hours ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Game controls with rainbow borders and joystick */}
      <GameBoyControls />
    </div>
  );
};

export default Game;
