import React from 'react';

// Simple achievements component based on COD style
const SimpleAchievements = () => {
  // Hardcoded achievements data
  const achievements = [
    {
      id: 1,
      name: "Unlock Gold Camo",
      description: "Get 100 Kills while using the Gold Camo",
      current: 0,
      target: 10
    },
    {
      id: 2,
      name: "Unlock Platinum Camo",
      description: "Get 200 Kills while using the Platinum Camo",
      current: 0,
      target: 25
    },
    {
      id: 3, 
      name: "First Taste of Gold",
      description: "Earn 10 trophies on a single post",
      current: 6,
      target: 10
    },
    {
      id: 4,
      name: "Crowd Favorite",
      description: "Get 50 trophies on a post",
      current: 28,
      target: 50
    },
    {
      id: 5,
      name: "Viral Sensation",
      description: "Reach 100 trophies on a single post",
      current: 42,
      target: 100
    },
    {
      id: 6,
      name: "Content King",
      description: "Earn 500 trophies on a post",
      current: 151,
      target: 500
    },
    {
      id: 7,
      name: "Clipt Icon",
      description: "Reach 1,000 trophies on a post—true viral status",
      current: 151,
      target: 1000
    },
    {
      id: 8,
      name: "Breaking In",
      description: "Rank in the Top 10 of the weekly leaderboard for the first time",
      current: 0,
      target: 1
    }
  ];

  return (
    <div className="w-full bg-black text-white p-4">
      <h2 className="text-white text-xl font-medium mb-4">Achievements</h2>
      
      {/* Achievement list */}
      <div className="space-y-0.5">
        {achievements.map(achievement => (
          <div key={achievement.id} className="bg-[#171717] hover:bg-[#232323]">
            <div className="p-3">
              {/* Top row with name and progress */}
              <div className="flex justify-between items-center mb-1.5">
                <h3 className="text-white text-sm font-medium">
                  {achievement.name}
                </h3>
                <div className="flex items-center">
                  <span className="text-yellow-500 text-[11px] font-medium">
                    {achievement.current}/{achievement.target}
                  </span>
                </div>
              </div>
              
              {/* Description */}
              <p className="text-gray-400 text-[11px] mb-2">
                {achievement.description}
              </p>
              
              {/* Progress bar */}
              <div className="w-full bg-[#2a2a2a] h-[2px]">
                <div 
                  className="bg-yellow-500 h-full" 
                  style={{ width: `${Math.min(100, (achievement.current / achievement.target) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimpleAchievements;
