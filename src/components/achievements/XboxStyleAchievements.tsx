import React, { useState } from 'react';
import { Trophy, Settings, Lock, ChevronDown } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { achievementService } from '@/services/achievementService';
import { useQuery } from '@tanstack/react-query';
import './XboxAchievements.css';

interface XboxStyleAchievementsProps {
  userId: string;
  forceShowDemo?: boolean;
}

const XboxStyleAchievements: React.FC<XboxStyleAchievementsProps> = ({ 
  userId, 
  forceShowDemo = false 
}) => {
  const [trackerEnabled, setTrackerEnabled] = useState(true);
  
  // Fetch achievements
  const { data: achievements, isLoading } = useQuery({
    queryKey: ['user-achievements', userId],
    queryFn: async () => {
      return await achievementService.getUserAchievements(userId);
    },
    enabled: !!userId
  });

  // Calculate totals
  const totalAchievements = achievements?.length || 0;
  const completedAchievements = achievements?.filter(a => a.completed)?.length || 0;
  const totalPoints = achievements?.reduce((sum, a) => sum + a.achievement.points, 0) || 0;
  const earnedPoints = achievements?.filter(a => a.completed)
    .reduce((sum, a) => sum + a.achievement.points, 0) || 0;

  // Show loading state or demo achievements if needed
  if (isLoading || forceShowDemo || !achievements || achievements.length === 0) {
    return renderDemoAchievements();
  }

  return (
    <div className="w-full max-w-md bg-gray-900/95 text-white rounded-lg p-5 backdrop-blur-sm xbox-achievements">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8">
          <img src="/xbox-logo.png" alt="Xbox" className="w-full h-full" 
               onError={(e) => {
                 const target = e.target as HTMLImageElement;
                 target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='8' r='7'%3E%3C/circle%3E%3Cpolyline points='8.21 13.89 7 23 12 20 17 23 15.79 13.88'%3E%3C/polyline%3E%3C/svg%3E";
               }}
          />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Achievements</h2>
          <p className="text-sm text-gray-300">Clipt</p>
        </div>
      </div>

      {/* Stats - Achievement and Gamerscore circles */}
      <div className="flex justify-center gap-12 mb-6">
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 rounded-full border-2 border-green-500 flex items-center justify-center bg-black/60 mb-1 relative">
            <Trophy className="w-6 h-6 text-white" />
            <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full w-5 h-5 flex items-center justify-center">
              <Trophy className="w-3 h-3 text-black" />
            </div>
          </div>
          <p className="text-sm font-semibold text-center">{completedAchievements}/{totalAchievements}</p>
        </div>
        
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 rounded-full border-2 border-green-500 flex items-center justify-center bg-black/60 mb-1 relative">
            <span className="text-white text-lg font-bold">G</span>
            <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full w-5 h-5 flex items-center justify-center">
              <span className="text-black text-xs font-bold">G</span>
            </div>
          </div>
          <p className="text-sm font-semibold text-center">{earnedPoints}/{totalPoints}</p>
        </div>
      </div>

      {/* Settings section */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm">Achievement tracker</span>
        <div className="flex items-center gap-3">
          <span className="text-sm">{trackerEnabled ? 'On' : 'Off'}</span>
          <Switch checked={trackerEnabled} onCheckedChange={setTrackerEnabled} />
          <div className="w-6 h-6 rounded border border-green-500 flex items-center justify-center">
            <Settings className="w-4 h-4 text-green-500" />
          </div>
        </div>
      </div>

      {/* Progress section */}
      <div className="mb-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Progress</span>
          <span className="text-sm">▼</span>
        </div>
      </div>

      {/* Achievement list */}
      <div className="space-y-4 mt-4">
        {achievements.map(achievement => (
          <div key={achievement.achievement_id} className="border-b border-gray-700/40 pb-3 xbox-achievement-item">
            <div className="flex justify-between items-center">
              <span className={achievement.completed ? 'text-white' : 'text-gray-400'}>
                {achievement.achievement.name}
              </span>
              <div className="flex items-center gap-1">
                <Trophy className={`w-4 h-4 ${achievement.completed ? 'text-white' : 'text-gray-500'}`} />
                <span className={achievement.completed ? 'text-white' : 'text-gray-400'}>
                  {achievement.achievement.points}
                </span>
              </div>
            </div>
            {achievement.achievement.progress_type === 'count' && (
              <div className="mt-1">
                <Progress 
                  value={(achievement.currentValue / achievement.achievement.target_value) * 100} 
                  className="h-1 bg-gray-700" 
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Function to render demo Xbox-style achievements
const renderDemoAchievements = () => {
  const demoAchievements = [
    { name: 'Sheriff', points: 50, completed: true, secret: false },
    { name: 'Put On a Show', points: 50, completed: true, secret: false },
    { name: 'King', points: 50, completed: true, secret: false },
    { name: 'Secret achievement', points: 0, completed: false, secret: true },
    { name: 'Boss', points: 50, completed: true, secret: false },
    { name: 'Secret achievement', points: 0, completed: false, secret: true },
  ];

  return (
    <div className="w-full max-w-md bg-gray-900/95 text-white rounded-lg p-5 backdrop-blur-sm xbox-achievements">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8">
          <Trophy className="w-full h-full text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Achievements</h2>
          <p className="text-sm text-gray-300">Clipt</p>
        </div>
      </div>

      {/* Stats - Achievement and Gamerscore circles */}
      <div className="flex justify-center gap-12 mb-6">
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 rounded-full border-2 border-[#76d600] flex items-center justify-center bg-gray-950 mb-1 relative xbox-circle">
            <Trophy className="w-6 h-6 text-white" />
            <div className="absolute -bottom-1 -right-1 bg-[#76d600] rounded-full w-5 h-5 flex items-center justify-center xbox-circle-badge">
              <Trophy className="w-3 h-3 text-black" />
            </div>
          </div>
          <p className="text-sm font-semibold text-center">19/28</p>
        </div>
        
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 rounded-full border-2 border-[#76d600] flex items-center justify-center bg-gray-950 mb-1 relative xbox-circle">
            <span className="text-white text-lg font-bold">G</span>
            <div className="absolute -bottom-1 -right-1 bg-[#76d600] rounded-full w-5 h-5 flex items-center justify-center xbox-circle-badge">
              <span className="text-black text-xs font-bold">G</span>
            </div>
          </div>
          <p className="text-sm font-semibold text-center">650/1000</p>
        </div>
      </div>

      {/* Settings section */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm">Achievement tracker</span>
        <div className="flex items-center gap-3">
          <span className="text-sm">On</span>
          <Switch checked={true} onCheckedChange={() => {}} />
          <div className="w-6 h-6 rounded border border-[#76d600] flex items-center justify-center xbox-setting-circle">
            <Settings className="w-4 h-4 text-[#76d600] xbox-setting-icon" />
          </div>
        </div>
      </div>

      {/* Progress section */}
      <div className="mb-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Progress</span>
          <span className="text-sm">▼</span>
        </div>
      </div>

      {/* Achievement list */}
      <div className="space-y-4 mt-4 xbox-achievement-list">
        {demoAchievements.map((achievement, index) => (
          <div key={index} className="border-b border-gray-700/40 pb-3 pt-1 mb-1 xbox-achievement-item">
            <div className="flex justify-between items-center">
              <span className={achievement.completed ? 'text-white xbox-achievement-completed' : 'text-gray-400/70 xbox-achievement-locked'}>
                {achievement.name}
              </span>
              <div className="flex items-center gap-1">
                {achievement.secret ? <Lock className="w-4 h-4 text-gray-400/70" /> : <Trophy className={`w-4 h-4 ${achievement.completed ? 'text-white' : 'text-gray-500'}`} />}
                <span className={achievement.completed ? 'text-white' : 'text-gray-400/70'}>
                  {achievement.secret ? '--' : `${achievement.points}`}
                </span>
              </div>
            </div>
            {/* Add progress bars for non-secret achievements */}
            {!achievement.secret && (
              <div className="mt-1 h-1.5">
                <div className="bg-gray-800 w-full h-1 rounded-sm overflow-hidden">
                  {achievement.completed && <div className="bg-[#76d600] h-full w-full"></div>}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default XboxStyleAchievements;
