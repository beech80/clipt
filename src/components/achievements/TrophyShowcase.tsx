import React, { FC, useState } from 'react';
import { Trophy, Award, Users, Calendar, MessageSquare, Lock, TrendingUp, Video, Star, Flame, Heart, Share, UserPlus, Tag, Link, Zap, ArrowUp, Gift, Check } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TrophyShowcaseProps {
  userId: string;
}

const TrophyShowcase: FC<TrophyShowcaseProps> = ({ userId }) => {
  // State for achievement data
  const [loading, setLoading] = useState(true);
  const [trophies, setTrophies] = useState<Trophy[]>([]);
  const [errorLoading, setErrorLoading] = useState(false);

  // Trophy category definitions
  const categories = [
    { id: 'all', name: 'All' },
    { id: 'trophy', name: 'Trophy' },
    { id: 'progress', name: 'Progress' },
    { id: 'skills', name: 'Skills' },
    { id: 'challenges', name: 'Challenges' },
  ];

  // Sample achievements with simple structure
  const fixedTrophies = [
    {
      id: 'trophy_1',
      name: 'First Taste of Gold',
      description: 'Earn 10 trophies on a single post',
      icon: 'trophy',
      category: 'trophy',
      difficulty: 'Easy',
      target: 10,
      current: 6,
      unlocked: false,
      points: 50
    },
    {
      id: 'trophy_2',
      name: 'Crowd Favorite',
      description: 'Get 50 trophies on a post',
      icon: 'trophy',
      category: 'trophy',
      difficulty: 'Medium',
      target: 50,
      current: 28,
      unlocked: false,
      points: 100
    },
    {
      id: 'trophy_3',
      name: 'Viral Sensation',
      description: 'Reach 100 trophies on a single post',
      icon: 'trophy',
      category: 'trophy',
      difficulty: 'Medium',
      target: 100,
      current: 42,
      unlocked: false,
      points: 200
    },
    {
      id: 'trophy_4',
      name: 'Content King',
      description: 'Earn 500 trophies on a post',
      icon: 'crown',
      category: 'trophy',
      difficulty: 'Hard',
      target: 500,
      current: 151,
      unlocked: false,
      points: 500
    },
    {
      id: 'trophy_5',
      name: 'Clipt Icon',
      description: 'Reach 1,000 trophies on a post—true viral status',
      icon: 'award',
      category: 'trophy',
      difficulty: 'Expert',
      target: 1000,
      current: 151,
      unlocked: false,
      points: 1000
    },
    {
      id: 'trophy_6',
      name: 'Breaking In',
      description: 'Rank in the Top 10 of the weekly leaderboard for the first time',
      icon: 'trending',
      category: 'trophy',
      difficulty: 'Medium',
      target: 1,
      current: 0,
      unlocked: false,
      points: 150
    },
    {
      id: 'trophy_7',
      name: 'Back-to-Back',
      description: 'Stay in the Top 10 for 2 consecutive weeks',
      icon: 'trending',
      category: 'trophy',
      difficulty: 'Hard',
      target: 2,
      current: 1,
      unlocked: false,
      points: 250
    },
    {
      id: 'trophy_8',
      name: 'Hot Streak',
      description: 'Maintain a Top 10 spot for 5 weeks straight',
      icon: 'flame',
      category: 'trophy',
      difficulty: 'Hard',
      target: 5,
      current: 2,
      unlocked: false,
      points: 500
    },
    {
      id: 'trophy_9',
      name: 'Unstoppable',
      description: 'Stay in the Top 10 for 10 consecutive weeks',
      icon: 'flame',
      category: 'trophy',
      difficulty: 'Expert',
      target: 10,
      current: 3,
      unlocked: false,
      points: 1000
    },
    {
      id: 'trophy_10',
      name: 'Clipt Hall of Fame',
      description: 'Rank in the Top 10 for 25 weeks total',
      icon: 'trophy',
      category: 'trophy',
      difficulty: 'Legend',
      target: 25,
      current: 5,
      unlocked: false,
      points: 2500
    }
  ];

  // Simple hard-coded achievements for demonstration
  const [trophies] = useState(fixedTrophies);
  const [loading] = useState(false);

  // State for active category
  const [activeCategory, setActiveCategory] = useState('all');

  // Display all trophies for now to ensure something is visible
  const displayTrophies = trophies;
  const totalUnlocked = 2;
  const totalTrophies = 6;

  // Get the appropriate icon based on trophy category
  const getIcon = (icon: string) => {
    switch(icon) {
      case 'trophy': return <Trophy className="w-8 h-8 text-yellow-500" />;
      case 'users': return <Users className="w-8 h-8 text-blue-500" />;
      case 'crown': return <Award className="w-8 h-8 text-purple-500" />;
      case 'calendar': return <Calendar className="w-8 h-8 text-green-500" />;
      case 'messageSquare': return <MessageSquare className="w-8 h-8 text-pink-500" />;
      case 'video': return <Video className="w-8 h-8 text-indigo-500" />;
      case 'trending': return <TrendingUp className="w-8 h-8 text-green-500" />;
      case 'award': return <Award className="w-8 h-8 text-yellow-500" />;
      case 'star': return <Star className="w-8 h-8 text-yellow-500" />;
      case 'flame': return <Flame className="w-8 h-8 text-orange-500" />;
      case 'heart': return <Heart className="w-8 h-8 text-red-500" />;
      case 'share': return <Share className="w-8 h-8 text-blue-500" />;
      case 'userPlus': return <UserPlus className="w-8 h-8 text-green-500" />;
      case 'tag': return <Tag className="w-8 h-8 text-blue-500" />;
      case 'link': return <Link className="w-8 h-8 text-orange-500" />;
      case 'zap': return <Zap className="w-8 h-8 text-yellow-500" />;
      case 'arrowUp': return <ArrowUp className="w-8 h-8 text-green-500" />;
      default: return <Trophy className="w-8 h-8 text-yellow-500" />;
    }
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch(difficulty) {
      case 'Easy': return 'text-green-500';
      case 'Medium': return 'text-yellow-500';
      case 'Hard': return 'text-orange-500';
      case 'Expert': return 'text-red-500';
      case 'Legend': return 'text-purple-500';
      case 'Special': return 'text-indigo-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="w-full bg-black text-white p-4">
      <h2 className="text-white text-xl font-medium mb-4">Achievements</h2>
      <div className="mb-3 text-gray-400 text-sm">
        {totalUnlocked}/{totalTrophies} completed
      </div>

      <div className="text-gray-500 text-xs mb-2">
        Showing {trophies.length} trophies
      </div>
      
      {/* Main trophy list */}
      <div className="mt-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Trophy className="w-12 h-12 text-gray-600 mb-4" />
            <p className="text-gray-500">Loading achievements...</p>
          </div>
        ) : displayTrophies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Trophy className="w-12 h-12 text-gray-600 mb-4" />
            <p className="text-gray-500">No achievements are available</p>
          </div>
        ) : (
          displayTrophies.map(trophy => {
            return (
              <div key={trophy.id} className="bg-[#1a1a1a] mb-2 hover:bg-gray-800 rounded-sm overflow-hidden">
                <div className="p-3">
                  {/* Top row with achievement name and progress */}
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-white text-sm font-medium">
                      {trophy.name}
                    </h3>
                    <div className="flex items-center">
                      <span className="text-yellow-500 text-[11px] font-medium">{trophy.current}/{trophy.target}</span>
                    </div>
                  </div>
                  
                  {/* Description exactly like in the image */}
                  <p className="text-gray-400 text-[11px] mb-2">{trophy.description}</p>
                  
                  {/* Progress tracker exactly like in the image - thin line */}
                  <div className="w-full bg-[#2a2a2a] h-[2px]">
                    <div 
                      className="bg-yellow-500 h-full" 
                      style={{ width: `${Math.min(100, (trophy.current / trophy.target) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      
      {/* Categories removed from bottom to match CoD UI */}
    </div>
  );
};

export default TrophyShowcase;
