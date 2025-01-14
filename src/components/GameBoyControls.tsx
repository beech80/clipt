import React, { useState, useRef, useEffect } from 'react';
import { 
  Heart,
  MessageSquare,
  UserPlus,
  Trophy,
  Menu
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const GameBoyControls = () => {
  const [activeDirection, setActiveDirection] = useState<string>('neutral');
  const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 });
  const joystickRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const navigate = useNavigate();

  const handleAction = (action: string) => {
    switch(action) {
      case 'like':
        toast.success('Liked!');
        break;
      case 'comment':
        toast.success('Comment added!');
        break;
      case 'follow':
        toast.success('Following!');
        break;
      case 'rank':
        toast.success('Ranked!');
        break;
      default:
        break;
    }
  };

  const handleDirectionClick = (direction: string) => {
    setActiveDirection(direction);
    switch (direction) {
      case 'up':
        setJoystickPosition({ x: 0, y: -12 });
        toast.info('Previous clip');
        break;
      case 'down':
        setJoystickPosition({ x: 0, y: 12 });
        toast.info('Next clip');
        break;
      case 'left':
        setJoystickPosition({ x: -12, y: 0 });
        toast.info('Rewind 10s');
        break;
      case 'right':
        setJoystickPosition({ x: 12, y: 0 });
        toast.info('Forward 10s');
        break;
      default:
        break;
    }
    setTimeout(() => {
      setActiveDirection('neutral');
      setJoystickPosition({ x: 0, y: 0 });
    }, 400);
  };

  const handleJoystickStart = (e: React.MouseEvent | React.TouchEvent) => {
    isDraggingRef.current = true;
    document.addEventListener('mousemove', handleJoystickMove as any);
    document.addEventListener('touchmove', handleJoystickMove as any);
    document.addEventListener('mouseup', handleJoystickEnd);
    document.addEventListener('touchend', handleJoystickEnd);
  };

  const handleJoystickMove = (e: MouseEvent | TouchEvent) => {
    if (!isDraggingRef.current || !joystickRef.current) return;

    const joystickRect = joystickRef.current.getBoundingClientRect();
    const centerX = joystickRect.left + joystickRect.width / 2;
    const centerY = joystickRect.top + joystickRect.height / 2;

    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const maxDistance = 12;
    const angle = Math.atan2(deltaY, deltaX);

    let newX = deltaX;
    let newY = deltaY;

    if (distance > maxDistance) {
      newX = Math.cos(angle) * maxDistance;
      newY = Math.sin(angle) * maxDistance;
    }

    setJoystickPosition({ x: newX, y: newY });

    // Determine direction based on position
    const threshold = maxDistance * 0.5;
    let direction = 'neutral';
    if (Math.abs(newX) > Math.abs(newY)) {
      direction = newX > threshold ? 'right' : newX < -threshold ? 'left' : 'neutral';
    } else {
      direction = newY > threshold ? 'down' : newY < -threshold ? 'up' : 'neutral';
    }
    
    if (direction !== activeDirection) {
      setActiveDirection(direction);
      if (direction !== 'neutral') {
        switch (direction) {
          case 'up':
            toast.info('Previous clip');
            break;
          case 'down':
            toast.info('Next clip');
            break;
          case 'left':
            toast.info('Rewind 10s');
            break;
          case 'right':
            toast.info('Forward 10s');
            break;
        }
      }
    }
  };

  const handleJoystickEnd = () => {
    isDraggingRef.current = false;
    document.removeEventListener('mousemove', handleJoystickMove as any);
    document.removeEventListener('touchmove', handleJoystickMove as any);
    document.removeEventListener('mouseup', handleJoystickEnd);
    document.removeEventListener('touchend', handleJoystickEnd);
    
    // Reset position with animation
    setJoystickPosition({ x: 0, y: 0 });
    setActiveDirection('neutral');
  };

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleJoystickMove as any);
      document.removeEventListener('touchmove', handleJoystickMove as any);
      document.removeEventListener('mouseup', handleJoystickEnd);
      document.removeEventListener('touchend', handleJoystickEnd);
    };
  }, []);

  const renderActionButtons = () => {
    return (
      <>
        <button 
          className="action-button transition-transform hover:scale-110 active:scale-95 group"
          onClick={() => handleAction('like')}
        >
          <Heart className="w-5 h-5 sm:w-6 sm:h-6 group-hover:text-gaming-400" />
        </button>
        <div className="flex gap-6 sm:gap-12 my-2 sm:my-3">
          <button 
            className="action-button transition-transform hover:scale-110 active:scale-95 group"
            onClick={() => handleAction('comment')}
          >
            <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 group-hover:text-gaming-400" />
          </button>
          <button 
            className="action-button transition-transform hover:scale-110 active:scale-95 group"
            onClick={() => handleAction('follow')}
          >
            <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 group-hover:text-gaming-400" />
          </button>
        </div>
        <button 
          className="action-button transition-transform hover:scale-110 active:scale-95 group"
          onClick={() => handleAction('rank')}
        >
          <Trophy className="w-5 h-5 sm:w-6 sm:h-6 group-hover:text-gaming-400" />
        </button>
      </>
    );
  };

  const navigationItems = [
    { name: 'Home', path: '/' },
    { name: 'Discover', path: '/discover' },
    { name: 'Messages', path: '/messages' },
    { name: 'Profile', path: '/profile' },
    { name: 'Streaming', path: '/streaming' },
    { name: 'Top Clips', path: '/top-clips' },
  ];

  return (
    <div className="gameboy-container h-[140px] sm:h-[160px] bg-background/95 backdrop-blur-sm fixed bottom-0 left-0 right-0 z-50">
      {/* Bottom Center Navigation Menu */}
      <div className="fixed bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <button className="rounded-full bg-gaming-400/20 p-2 sm:p-3 backdrop-blur-sm border border-gaming-400/30 hover:bg-gaming-400/30 transition-all duration-300">
              <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-gaming-400" />
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="w-full max-w-xl mx-auto rounded-t-xl bg-background/95 backdrop-blur-xl border-gaming-400/30">
            <nav className="grid grid-cols-2 gap-2 p-3">
              {navigationItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    toast.success(`Navigating to ${item.name}`);
                  }}
                  className="p-2 sm:p-3 rounded-lg bg-gaming-400/10 hover:bg-gaming-400/20 transition-all duration-300 text-gaming-400 font-medium text-sm"
                >
                  {item.name}
                </button>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>

      {/* D-Pad with Xbox-style joystick */}
      <div className="fixed left-4 sm:left-8 bottom-8 sm:bottom-10 w-28 sm:w-32 h-28 sm:h-32">
        <div 
          ref={joystickRef}
          className="relative w-full h-full bg-gaming-400/10 rounded-full border-2 border-gaming-400/30 backdrop-blur-sm shadow-xl cursor-grab active:cursor-grabbing"
          onMouseDown={handleJoystickStart}
          onTouchStart={handleJoystickStart}
        >
          {/* Solid black joystick with smooth dragging */}
          <div 
            className="absolute inset-0 m-auto w-16 sm:w-20 h-16 sm:h-20 rounded-full bg-black shadow-lg transition-transform duration-150 ease-out"
            style={{ 
              transform: `translate(${joystickPosition.x}px, ${joystickPosition.y}px)`,
            }}
          />
          
          {/* Larger touch areas for directional buttons */}
          <button 
            onClick={() => handleDirectionClick('up')}
            className={`absolute top-0 left-1/2 -translate-x-1/2 w-12 sm:w-14 h-12 sm:h-14 rounded-full 
              ${activeDirection === 'up' ? 'bg-gaming-400/50' : 'bg-transparent'} 
              hover:bg-gaming-400/30 transition-all duration-300 -translate-y-1`}
          />
          <button 
            onClick={() => handleDirectionClick('right')}
            className={`absolute right-0 top-1/2 -translate-y-1/2 w-12 sm:w-14 h-12 sm:h-14 rounded-full 
              ${activeDirection === 'right' ? 'bg-gaming-400/50' : 'bg-transparent'} 
              hover:bg-gaming-400/30 transition-all duration-300 translate-x-1`}
          />
          <button 
            onClick={() => handleDirectionClick('down')}
            className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-12 sm:w-14 h-12 sm:h-14 rounded-full 
              ${activeDirection === 'down' ? 'bg-gaming-400/50' : 'bg-transparent'} 
              hover:bg-gaming-400/30 transition-all duration-300 translate-y-1`}
          />
          <button 
            onClick={() => handleDirectionClick('left')}
            className={`absolute left-0 top-1/2 -translate-y-1/2 w-12 sm:w-14 h-12 sm:h-14 rounded-full 
              ${activeDirection === 'left' ? 'bg-gaming-400/50' : 'bg-transparent'} 
              hover:bg-gaming-400/30 transition-all duration-300 -translate-x-1`}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="fixed right-4 sm:right-8 bottom-8 sm:bottom-10 w-28 sm:w-32 h-28 sm:h-32 flex flex-col items-center justify-center">
        {renderActionButtons()}
      </div>
    </div>
  );
};

export default GameBoyControls;