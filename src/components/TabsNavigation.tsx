import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Grid, Film, Trophy, Bookmark } from 'lucide-react';

const TabsNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const getTabClass = (path: string) => {
    const isActive = location.pathname === path;
    return `flex flex-col items-center ${
      isActive ? 'text-orange-400 border-b-2 border-orange-400 -mb-3 pb-1' : 'text-gray-400'
    }`;
  };
  
  return (
    <div className="fixed top-0 left-0 right-0 bg-[#1a1b26] border-b border-[#2c2d4a] z-40">
      <div className="max-w-screen-md mx-auto">
        <div className="flex justify-between items-center">
          <button 
            className={getTabClass('/post-form')}
            onClick={() => navigate('/post-form')}
          >
            <Grid className="w-5 h-5 mb-1" />
            <span className="text-xs">Posts</span>
          </button>
          
          <button 
            className={getTabClass('/clipts')}
            onClick={() => navigate('/clipts')}
          >
            <Film className="w-5 h-5 mb-1" />
            <span className="text-xs">Clipts</span>
          </button>
          
          <button 
            className={getTabClass('/trophies')}
            onClick={() => navigate('/trophies')}
          >
            <Trophy className="w-5 h-5 mb-1" />
            <span className="text-xs">Trophies</span>
          </button>
          
          <button 
            className={getTabClass('/saved')}
            onClick={() => navigate('/saved')}
          >
            <Bookmark className="w-5 h-5 mb-1" />
            <span className="text-xs">Saved</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TabsNavigation;
