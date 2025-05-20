import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { Gamepad2, TrendingUp, Users } from 'lucide-react';

const TopGames = () => {
  const navigate = useNavigate();
  
  // Sample game data
  const games = [
    { id: 1, name: "Fortnite", players: "2.4M", trending: true },
    { id: 2, name: "Counter-Strike 2", players: "1.2M", trending: true },
    { id: 3, name: "Apex Legends", players: "980K", trending: false },
    { id: 4, name: "Call of Duty: Warzone", players: "850K", trending: true },
    { id: 5, name: "Valorant", players: "820K", trending: false },
    { id: 6, name: "League of Legends", players: "780K", trending: false },
    { id: 7, name: "Dota 2", players: "650K", trending: false },
    { id: 8, name: "Minecraft", players: "620K", trending: true },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a237e] to-[#0d1b3c]">
      <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-black/40 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center justify-center max-w-7xl mx-auto relative">
          <BackButton />
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="text-purple-400" size={24} />
            Top Games
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-24 pb-20 max-w-2xl">
        <div className="bg-black/30 backdrop-blur-sm rounded-xl border border-white/10 shadow-xl overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search games..." 
                className="w-full bg-gray-800/50 border border-gray-700 rounded-full py-2 px-4 text-white placeholder:text-gray-400 pl-10"
              />
              <svg 
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <div className="divide-y divide-white/10">
            {games.map(game => (
              <div 
                key={game.id}
                className="flex items-center justify-between p-4 hover:bg-white/5 cursor-pointer transition-colors"
                onClick={() => navigate(`/game/${game.id}`)}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
                    <Gamepad2 className="text-purple-400" size={20} />
                  </div>
                  <div>
                    <div className="flex items-center">
                      <h3 className="font-medium text-white">{game.name}</h3>
                      {game.trending && (
                        <span className="ml-2 px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-md flex items-center">
                          <TrendingUp size={12} className="mr-1" />
                          Hot
                        </span>
                      )}
                    </div>
                    <div className="flex items-center text-gray-400 text-sm mt-1">
                      <Users size={14} className="mr-1" />
                      {game.players} players
                    </div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-gray-700 text-gray-300 hover:bg-purple-600 hover:text-white hover:border-purple-600"
                >
                  Follow
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopGames;
