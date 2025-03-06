import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, 
  Heart, 
  Camera,
  MessageCircle, 
  Trophy, 
  UserPlus, 
  X 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface GameBoyControlsProps {
  currentPostId?: string;
}

const GameBoyControls: React.FC<GameBoyControlsProps> = ({ currentPostId: propCurrentPostId }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentPath, setCurrentPath] = useState(location.pathname);
  const [currentPostId, setCurrentPostId] = useState<string | null>(propCurrentPostId || null);
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickDirection, setJoystickDirection] = useState<'up' | 'down' | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const joystickTimer = React.useRef<NodeJS.Timeout | null>(null);
  const joystickRef = useRef<HTMLDivElement>(null);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const [pulsating, setPulsating] = useState(false);
  const [glowing, setGlowing] = useState(true);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; opacity: number; size: number; color: string }>>([]);
  const [buttonsAnimated, setButtonsAnimated] = useState(false);

  // CLIPT button animation with enhanced effects
  useEffect(() => {
    // Pulse animation
    const pulseInterval = setInterval(() => {
      setPulsating(true);
      
      // Generate particles when pulsing
      createParticles();
      
      setTimeout(() => setPulsating(false), 1500);
    }, 5000);
    
    // Glow animation with smoother transition
    const glowInterval = setInterval(() => {
      setGlowing(prev => !prev);
    }, 2000);
    
    // Button hover animation toggle
    const buttonAnimationInterval = setInterval(() => {
      setButtonsAnimated(prev => !prev);
    }, 8000);
    
    return () => {
      clearInterval(pulseInterval);
      clearInterval(glowInterval);
      clearInterval(buttonAnimationInterval);
    };
  }, []);
  
  // Particle effect system
  const createParticles = () => {
    const newParticles = [];
    const colors = ['#6c4dc4', '#8654dc', '#4f46e5', '#8b5cf6', '#a78bfa'];
    
    for (let i = 0; i < 12; i++) {
      newParticles.push({
        id: Math.random(),
        x: 50 + Math.random() * 10 - 5, // center x with slight variation
        y: 50 + Math.random() * 10 - 5, // center y with slight variation
        opacity: 0.8 + Math.random() * 0.2,
        size: 3 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    
    setParticles(newParticles);
    
    // Animate particles fading out
    setTimeout(() => {
      setParticles([]);
    }, 2000);
  };

  // Handle joystick movement
  useEffect(() => {
    const joystick = joystickRef.current;
    if (!joystick) return;

    let isDragging = false;
    let startPos = { x: 0, y: 0 };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      startPos = { x: e.clientX, y: e.clientY };
    };

    const handleTouchStart = (e: TouchEvent) => {
      isDragging = true;
      startPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      updateJoystickPosition(e.clientX - startPos.x, e.clientY - startPos.y);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      updateJoystickPosition(
        e.touches[0].clientX - startPos.x,
        e.touches[0].clientY - startPos.y
      );
    };

    const handleMouseUp = () => {
      if (!isDragging) return;
      isDragging = false;
      resetJoystickPosition();
    };

    const updateJoystickPosition = (x: number, y: number) => {
      const maxDistance = 5;
      const distance = Math.sqrt(x * x + y * y);
      
      if (distance > maxDistance) {
        const ratio = maxDistance / distance;
        x *= ratio;
        y *= ratio;
      }
      
      setJoystickPos({ x, y });
    };

    const resetJoystickPosition = () => {
      setJoystickPos({ x: 0, y: 0 });
    };

    joystick.addEventListener('mousedown', handleMouseDown);
    joystick.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchend', handleMouseUp);

    return () => {
      joystick.removeEventListener('mousedown', handleMouseDown);
      joystick.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, []);

  // Keep track of current route
  useEffect(() => {
    setCurrentPath(location.pathname);
    
    // Update current post ID when prop changes
    if (propCurrentPostId) {
      setCurrentPostId(propCurrentPostId);
    }
    
    // Reset the current post ID when changing routes
    if (location.pathname !== currentPath && !propCurrentPostId) {
      setCurrentPostId(null);
    }

    // Close menu when changing routes
    setMenuOpen(false);
  }, [location.pathname, propCurrentPostId, currentPath]);
  
  // Detect current visible post ID
  useEffect(() => {
    // Skip if we already have a post ID from props
    if (propCurrentPostId) return;
    
    const findVisiblePostId = () => {
      // Find all post elements
      const posts = document.querySelectorAll('[data-post-id]');
      if (!posts.length) return;
      
      // Find the post most visible in the viewport
      let mostVisiblePost: Element | null = null;
      let maxVisibleArea = 0;
      
      posts.forEach(post => {
        const rect = post.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        
        // Skip if post is not visible
        if (rect.bottom < 100 || rect.top > viewportHeight - 100) {
          return;
        }
        
        // Calculate visible area
        const visibleTop = Math.max(0, rect.top);
        const visibleBottom = Math.min(viewportHeight, rect.bottom);
        const visibleHeight = visibleBottom - visibleTop;
        const visibleRatio = visibleHeight / rect.height;
        
        if (visibleRatio > maxVisibleArea) {
          maxVisibleArea = visibleRatio;
          mostVisiblePost = post;
        }
      });
      
      if (mostVisiblePost && maxVisibleArea > 0.3) {
        const postId = mostVisiblePost.getAttribute('data-post-id');
        if (postId && postId !== currentPostId) {
          setCurrentPostId(postId);
        }
      }
    };
    
    // Run on scroll and resize
    findVisiblePostId();
    window.addEventListener('scroll', findVisiblePostId);
    window.addEventListener('resize', findVisiblePostId);
    
    return () => {
      window.removeEventListener('scroll', findVisiblePostId);
      window.removeEventListener('resize', findVisiblePostId);
    };
  }, [currentPostId, propCurrentPostId]);

  // Handler functions for each button
  const handleLike = async () => {
    if (!currentPostId) return;
    console.log('Like post:', currentPostId);
    
    try {
      // Check if already liked
      const { data: existingLike } = await supabase
        .from('likes')
        .select('*')
        .eq('post_id', currentPostId)
        .eq('user_id', supabase.auth.getUser()?.data?.user?.id || '')
        .single();
      
      if (existingLike) {
        // Unlike
        await supabase
          .from('likes')
          .delete()
          .eq('id', existingLike.id);
          
        // Show toast indicating successful unlike
        toast.success('Removed like from post');
      } else {
        // Like
        await supabase
          .from('likes')
          .insert({
            post_id: currentPostId,
            user_id: supabase.auth.getUser()?.data?.user?.id || '',
            created_at: new Date().toISOString()
          });
          
        // Show toast indicating successful like
        toast.success('Liked post');
      }
      
      // Trigger a refresh for the post's like count
      document.dispatchEvent(new CustomEvent('refresh-post', {
        detail: { postId: currentPostId }
      }));
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error('Failed to like post');
    }
  };

  const handleComment = () => {
    if (!currentPostId) return;
    console.log('Comment on post:', currentPostId);
    
    // Navigate to the post page with comment section visible
    navigate(`/post/${currentPostId}?showComments=true`);
  };

  const handleFollow = () => {
    if (!currentPostId) return;
    console.log('Follow user from post:', currentPostId);
    
    // Get the post's user_id and follow/unfollow that user
    (async () => {
      try {
        // First, get the post to find its author
        const { data: post } = await supabase
          .from('posts')
          .select('user_id')
          .eq('id', currentPostId)
          .single();
          
        if (!post) {
          toast.error('Could not find post');
          return;
        }
        
        const currentUserId = supabase.auth.getUser()?.data?.user?.id;
        
        if (!currentUserId) {
          toast.error('You need to be logged in to follow users');
          return;
        }
        
        if (currentUserId === post.user_id) {
          toast.error('You cannot follow yourself');
          return;
        }
        
        // Check if already following
        const { data: existingFollow } = await supabase
          .from('follows')
          .select('*')
          .eq('follower_id', currentUserId)
          .eq('following_id', post.user_id)
          .single();
          
        if (existingFollow) {
          // Unfollow
          await supabase
            .from('follows')
            .delete()
            .eq('id', existingFollow.id);
            
          toast.success('Unfollowed user');
        } else {
          // Follow
          await supabase
            .from('follows')
            .insert({
              follower_id: currentUserId,
              following_id: post.user_id,
              created_at: new Date().toISOString()
            });
            
          toast.success('Following user');
        }
        
        // Trigger a refresh for the profile
        document.dispatchEvent(new CustomEvent('refresh-profile', {
          detail: { userId: post.user_id }
        }));
      } catch (error) {
        console.error('Error following user:', error);
        toast.error('Failed to follow user');
      }
    })();
  };
  
  const handleTrophy = () => {
    if (!currentPostId) return;
    console.log('Trophy for post:', currentPostId);
    
    // Vote for this clip (trophy functionality)
    (async () => {
      try {
        const currentUserId = supabase.auth.getUser()?.data?.user?.id;
        
        if (!currentUserId) {
          toast.error('You need to be logged in to vote for clips');
          return;
        }
        
        // Check if already voted
        const { data: existingVote } = await supabase
          .from('clip_votes')
          .select('*')
          .eq('post_id', currentPostId)
          .eq('user_id', currentUserId)
          .single();
          
        if (existingVote) {
          // Remove vote
          await supabase
            .from('clip_votes')
            .delete()
            .eq('id', existingVote.id);
            
          toast.success('Removed vote from clip');
        } else {
          // Vote
          await supabase
            .from('clip_votes')
            .insert({
              post_id: currentPostId,
              user_id: currentUserId,
              created_at: new Date().toISOString()
            });
            
          toast.success('Voted for clip');
        }
        
        // Trigger a refresh for the post's vote count
        document.dispatchEvent(new CustomEvent('refresh-post', {
          detail: { postId: currentPostId }
        }));
      } catch (error) {
        console.error('Error voting for clip:', error);
        toast.error('Failed to vote for clip');
      }
    })();
  };

  const handleClipt = () => {
    // Navigate to the Clipts page
    navigate('/clipts');
  };

  const handleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handleJoystickDown = (direction: 'up' | 'down') => {
    setJoystickActive(true);
    setJoystickDirection(direction);
    
    // Start continuous scrolling
    if (joystickTimer.current) {
      clearInterval(joystickTimer.current);
    }
    
    joystickTimer.current = setInterval(() => {
      if (direction === 'up') {
        window.scrollBy(0, -30);
      } else {
        window.scrollBy(0, 30);
      }
    }, 50);
  };
  
  const handleJoystickUp = () => {
    setJoystickActive(false);
    setJoystickDirection(null);
    
    if (joystickTimer.current) {
      clearInterval(joystickTimer.current);
      joystickTimer.current = null;
    }
  };

  // Navigation helper
  const navigateTo = (path: string) => {
    navigate(path);
    setMenuOpen(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="bg-[#10101e]/95 backdrop-blur border-t border-[#353b5a]/50 pb-5 pt-5 px-2 md:px-16 lg:px-24 w-full">
        <div className="grid grid-cols-3 items-center">
          {/* Left joystick - moved right and styled like Xbox controller */}
          <div className="flex justify-start pl-4">
            <div className="relative w-[64px] h-[64px] flex items-center justify-center">
              <div 
                ref={joystickRef}
                className="w-[58px] h-[58px] rounded-full border-2 border-[#353b5a]/90 bg-[#232538] flex items-center justify-center shadow-inner"
                style={{
                  transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`,
                  boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.6)'
                }}
              >
                {/* Xbox-like joystick inner dot */}
                <div className="w-[26px] h-[26px] rounded-full bg-[#353b5a]/80"></div>
              </div>
            </div>
          </div>
          
          {/* Center section - perfectly centered */}
          <div className="flex flex-col items-center space-y-4">
            {/* Enhanced Game-styled CLIPT button on top */}
            <div 
              className={`relative w-[70px] h-[70px] rounded-full flex items-center justify-center cursor-pointer overflow-hidden transition-all duration-500 ${pulsating ? 'scale-110' : 'scale-100'}`}
              onClick={() => {
                createParticles();
                handleClipt();
              }}
              style={{
                background: 'radial-gradient(circle at 50% 30%, #4a357a, #2d1f54)',
                boxShadow: glowing 
                  ? '0 0 20px 6px rgba(128, 90, 213, 0.8), inset 0 0 15px rgba(255, 255, 255, 0.1)' 
                  : '0 0 12px 3px rgba(128, 90, 213, 0.5), inset 0 0 10px rgba(255, 255, 255, 0.05)',
                border: '2px solid rgba(147, 51, 234, 0.6)',
                transform: `rotate(${buttonsAnimated ? '5deg' : '0deg'})`,
                transition: 'transform 0.5s ease-in-out, box-shadow 0.5s ease-in-out, background 0.5s ease-in-out'
              }}
            >
              {/* Particles effect */}
              {particles.map((particle, index) => (
                <div 
                  key={particle.id}
                  className="absolute rounded-full z-20"
                  style={{
                    left: `${particle.x}%`,
                    top: `${particle.y}%`,
                    width: `${particle.size}px`,
                    height: `${particle.size}px`,
                    backgroundColor: particle.color,
                    opacity: particle.opacity,
                    filter: 'blur(1px)',
                    animation: 'float-out 2s ease-out forwards'
                  }}
                />
              ))}
              
              {/* Inner shine effect - enhanced */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#6c4dc4]/30 to-transparent opacity-80"></div>
              
              {/* Inner ring */}
              <div className="absolute inset-[5px] rounded-full border-2 border-purple-500/20"></div>
              
              {/* Metallic text with 3D effect */}
              <div className="relative z-10 flex items-center justify-center">
                <span 
                  className="font-extrabold text-base tracking-wider"
                  style={{
                    color: 'transparent',
                    background: 'linear-gradient(to bottom, #ffffff, #a78bfa)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    textShadow: '0 1px 0 rgba(0,0,0,0.4), 0 2px 3px rgba(0,0,0,0.2)'
                  }}
                >
                  CLIPT
                </span>
              </div>
              
              {/* Orbital ring animation */}
              <div 
                className="absolute inset-[-4px] rounded-full" 
                style={{
                  background: 'conic-gradient(from 0deg, #4f46e5, #8b5cf6, #8654dc, #6c4dc4, #4f46e5)',
                  opacity: 0.6,
                  filter: 'blur(4px)',
                  zIndex: -1,
                  animation: 'spin 8s linear infinite'
                }}
              />
              
              {/* Highlight reflection */}
              <div className="absolute top-0 left-1/4 w-1/2 h-[10px] bg-white/30 rounded-b-full"></div>
              
              {/* Bottom shadow */}
              <div className="absolute bottom-1 left-1/4 w-1/2 h-[6px] bg-black/20 rounded-t-full blur-[2px]"></div>
            </div>
            
            {/* Menu and Post buttons in a row below, like Xbox controller lower buttons */}
            <div className="flex justify-center items-center space-x-12">
              {/* Menu button */}
              <div 
                className={`w-[42px] h-[42px] rounded-full bg-[#232538] border border-[#353b5a]/80 flex items-center justify-center cursor-pointer transition-all duration-300 ${buttonsAnimated ? 'hover:scale-110' : ''}`}
                onClick={handleMenu}
                style={{
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.1)'
                }}
              >
                <Menu size={18} className="text-white" />
              </div>
              
              {/* POST/Camera button - styled to match hamburger button */}
              <div 
                className={`w-[42px] h-[42px] rounded-full bg-[#232538] border border-[#353b5a]/80 flex items-center justify-center cursor-pointer transition-all duration-300 ${buttonsAnimated ? 'hover:scale-110' : ''}`}
                onClick={() => navigate('/post/new')}
                style={{
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.1)'
                }}
              >
                <Camera size={18} className="text-white" />
              </div>
            </div>
          </div>
          
          {/* Right diamond buttons */}
          <div className="flex justify-end">
            <div className="flex flex-col items-center -mt-1">
              <div className="relative w-[120px] h-[120px]">
                {/* Top button (Heart/Like) */}
                <div 
                  className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[38px] h-[38px] rounded-full bg-[#232538] border border-[#353b5a]/80 flex items-center justify-center cursor-pointer" 
                  onClick={handleLike}
                >
                  <Heart size={18} className="text-red-500" />
                </div>
                
                {/* Left button (Message/Comment) */}
                <div 
                  className="absolute top-1/2 left-0 transform -translate-y-1/2 w-[38px] h-[38px] rounded-full bg-[#232538] border border-[#353b5a]/80 flex items-center justify-center cursor-pointer" 
                  onClick={handleComment}
                >
                  <MessageCircle size={18} className="text-blue-500" />
                </div>
                
                {/* Right button (Trophy) */}
                <div 
                  className="absolute top-1/2 right-0 transform -translate-y-1/2 w-[38px] h-[38px] rounded-full bg-[#232538] border border-[#353b5a]/80 flex items-center justify-center cursor-pointer" 
                  onClick={handleTrophy}
                >
                  <Trophy size={18} className="text-yellow-500" />
                </div>
                
                {/* Bottom button (UserPlus/Follow) */}
                <div 
                  className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[38px] h-[38px] rounded-full bg-[#232538] border border-[#353b5a]/80 flex items-center justify-center cursor-pointer" 
                  onClick={handleFollow}
                >
                  <UserPlus size={18} className="text-green-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Menu dialog */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm">
          <div className="absolute bottom-20 left-0 right-0 bg-[#161925] border-t border-blue-500/30">
            <div className="max-w-md mx-auto p-4">
              <h3 className="text-white text-lg font-semibold mb-4">Menu</h3>
              <div className="grid grid-cols-2 gap-y-4">
                <div 
                  className="flex items-center space-x-3 p-2 rounded hover:bg-blue-500/10 cursor-pointer"
                  onClick={() => {
                    navigateTo('/profile');
                  }}
                >
                  <UserPlus size={18} className="text-blue-400" />
                  <span className="text-white">Profile</span>
                </div>
                <div 
                  className="flex items-center space-x-3 p-2 rounded hover:bg-blue-500/10 cursor-pointer"
                  onClick={() => {
                    navigateTo('/streaming');
                  }}
                >
                  <Camera size={18} className="text-red-400" />
                  <span className="text-white">Streaming</span>
                </div>
                <div 
                  className="flex items-center space-x-3 p-2 rounded hover:bg-blue-500/10 cursor-pointer"
                  onClick={() => {
                    navigateTo('/discovery');
                  }}
                >
                  <MessageCircle size={18} className="text-green-400" />
                  <span className="text-white">Discovery</span>
                </div>
                <div 
                  className="flex items-center space-x-3 p-2 rounded hover:bg-blue-500/10 cursor-pointer"
                  onClick={() => {
                    navigateTo('/messages');
                  }}
                >
                  <Trophy size={18} className="text-purple-400" />
                  <span className="text-white">Messages</span>
                </div>
                <div 
                  className="flex items-center space-x-3 p-2 rounded hover:bg-blue-500/10 cursor-pointer"
                  onClick={() => {
                    navigateTo('/settings');
                  }}
                >
                  <Menu size={18} className="text-gray-400" />
                  <span className="text-white">Settings</span>
                </div>
                <div 
                  className="flex items-center space-x-3 p-2 rounded hover:bg-blue-500/10 cursor-pointer"
                  onClick={() => {
                    navigateTo('/');
                  }}
                >
                  <Heart size={18} className="text-yellow-400" />
                  <span className="text-white">Home</span>
                </div>
                <div 
                  className="flex items-center space-x-3 p-2 rounded hover:bg-blue-500/10 cursor-pointer"
                  onClick={() => {
                    navigateTo('/clipts');
                  }}
                >
                  <UserPlus size={18} className="text-indigo-400" />
                  <span className="text-white">Clipts</span>
                </div>
                <div 
                  className="flex items-center space-x-3 p-2 rounded hover:bg-blue-500/10 cursor-pointer"
                  onClick={() => {
                    navigateTo('/top-clipts');
                  }}
                >
                  <Trophy size={18} className="text-orange-400" />
                  <span className="text-white">Top Clipts</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameBoyControls;
