import React from 'react';
import { Menu, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const GameBoyControls: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLike = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    toast.success('Like action triggered!');
  };

  const handleComment = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    toast('Opening comments');
  };

  const handleFollow = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    toast.success('Follow action triggered!');
  };

  const handleRank = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    toast.success('Rank action triggered!');
  };

  const handlePost = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate('/clipts/post');
  };

  return (
    <div className="h-12 bg-[#1d1f2e] fixed bottom-0 left-0 right-0 z-50 border-t border-[#3e4462]/30 flex items-center justify-between">
      {/* Left joystick */}
      <div className="flex-1">
        <div className="relative flex justify-start ml-5">
          <div className="w-16 h-16 relative -mt-3">
            <div className="absolute w-16 h-16 bg-gradient-to-b from-[#3b3d48] to-[#252732] rounded-full shadow-lg flex items-center justify-center">
              <div className="w-12 h-12 bg-[#23252f] rounded-full border border-[#1b1d29] flex items-center justify-center">
                <div className="w-7 h-7 bg-[#1d1f2e] rounded-full border border-[#34363F]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Center area */}
      <div className="absolute left-1/2 transform -translate-x-1/2 -mt-11">
        {/* CLIPT button */}
        <button 
          onClick={() => navigate('/clipts')}
          className="relative focus:outline-none"
          aria-label="CLIPT"
        >
          <div className="w-[65px] h-[65px]" style={{ 
            background: 'linear-gradient(135deg, #4f9cf9 0%, #a651fb 50%, #f046ff 100%)',
            borderRadius: '100%',
            padding: '2px'
          }}>
            <div className="w-full h-full rounded-full bg-[#1d1f2e] flex items-center justify-center text-white">
              <div className="flex flex-col items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
                  <circle cx="12" cy="13" r="3"></circle>
                </svg>
                <span className="text-[10px] font-bold mt-0.5">CLIPT</span>
              </div>
            </div>
          </div>
        </button>
      </div>
      
      {/* Right buttons */}
      <div className="flex-1 flex justify-end mr-5">
        <div className="relative w-[90px] h-[90px] -mt-8">
          {/* Heart button (top) */}
          <button 
            onClick={handleLike}
            className="absolute top-0 left-1/2 transform -translate-x-1/2 focus:outline-none"
            aria-label="Like"
          >
            <div className="w-8 h-8 bg-[#ff3a5e]/20 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff3a5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
              </svg>
            </div>
          </button>
          
          {/* Message bubble button (left) */}
          <button 
            onClick={handleComment}
            className="absolute top-1/2 left-0 transform -translate-y-1/2 focus:outline-none"
            aria-label="Comment"
          >
            <div className="w-8 h-8 bg-[#4f9cf9]/20 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4f9cf9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
          </button>
          
          {/* Person button (right) */}
          <button 
            onClick={handleFollow}
            className="absolute top-1/2 right-0 transform -translate-y-1/2 focus:outline-none"
            aria-label="Follow"
          >
            <div className="w-8 h-8 bg-[#2ecc71]/20 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2ecc71" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
          </button>
          
          {/* Trophy button (bottom) */}
          <button 
            onClick={handleRank}
            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 focus:outline-none"
            aria-label="Rank"
          >
            <div className="w-8 h-8 bg-[#f1c40f]/20 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f1c40f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
                <path d="M4 22h16"></path>
                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
              </svg>
            </div>
          </button>
          
          {/* POST button */}
          <button 
            onClick={handlePost}
            className="absolute bottom-6 right-1 focus:outline-none"
            aria-label="Post"
          >
            <div className="px-2 py-1 bg-[#8047f8] rounded-full flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
                <circle cx="12" cy="13" r="3"></circle>
              </svg>
              <span className="text-[10px] text-white font-medium">POST</span>
            </div>
          </button>
        </div>
      </div>
      
      {/* Menu button */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
        <Sheet>
          <SheetTrigger asChild>
            <button className="w-7 h-7 rounded-full bg-[#4c4f74]/80 flex items-center justify-center border border-[#5f6384]/30 focus:outline-none">
              <Menu className="w-4 h-4 text-[#8c91c0]" />
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="w-full max-w-xl mx-auto rounded-t-xl bg-[#1e2130]/95 backdrop-blur-xl border-[#3e4462]/30">
            <nav className="grid grid-cols-2 gap-2 p-3">
              <button onClick={() => navigate('/')} 
                className="flex items-center gap-2 p-3 rounded-lg bg-[#30323d]/20 hover:bg-[#30323d]/30 text-white/80">
                Home
              </button>
              <button onClick={() => navigate('/discover')} 
                className="flex items-center gap-2 p-3 rounded-lg bg-[#30323d]/20 hover:bg-[#30323d]/30 text-white/80">
                Discover
              </button>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

export default GameBoyControls;
