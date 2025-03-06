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
  const [joystickDirection, setJoystickDirection] = useState<'up' | 'down' | 'left' | 'right' | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const joystickRef = useRef<HTMLDivElement>(null);
  const joystickKnobRef = useRef<HTMLDivElement>(null);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const [pulsating, setPulsating] = useState(false);
  const [glowing, setGlowing] = useState(true);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; opacity: number; size: number; color: string }>>([]);
  const [buttonsAnimated, setButtonsAnimated] = useState(false);
  const lastScrollTime = useRef<number>(0);

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

  // For smooth scrolling
  const scrollDistance = 300; // pixels to scroll per movement
  const scrollDuration = 300; // ms for animation duration

  // Animation for smooth scrolling
  const smoothScroll = (distance: number) => {
    const startPosition = window.scrollY;
    const startTime = performance.now();
    
    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / scrollDuration, 1);
      const easeInOut = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        
      window.scrollTo(0, startPosition + distance * easeInOut);
      
      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      }
    };
    
    requestAnimationFrame(animateScroll);
  };

  const handleJoystickMove = (x: number, y: number) => {
    const joystick = joystickRef.current;
    const knob = joystickKnobRef.current;
    if (!joystick || !knob) return;
    
    const joystickRect = joystick.getBoundingClientRect();
    const knobRect = knob.getBoundingClientRect();
    
    // Calculate joystick center
    const centerX = joystickRect.width / 2;
    const centerY = joystickRect.height / 2;
    
    // Calculate distance from center
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Max distance the knob can travel
    const maxDistance = joystickRect.width / 2 - knobRect.width / 2;
    
    // Normalize coordinates if outside the max distance
    let newX = dx;
    let newY = dy;
    
    if (distance > maxDistance) {
      newX = (dx / distance) * maxDistance;
      newY = (dy / distance) * maxDistance;
    }
    
    // Apply the position to the knob
    knob.style.transform = `translate(${newX}px, ${newY}px)`;
    
    // Determine direction
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    let direction: 'up' | 'down' | 'left' | 'right' | null = null;
    
    // Only register direction if joystick is moved significantly
    if (distance > maxDistance * 0.5) {
      if (angle > -45 && angle <= 45) {
        direction = 'right';
      } else if (angle > 45 && angle <= 135) {
        direction = 'down';
      } else if (angle > 135 || angle <= -135) {
        direction = 'left';
      } else {
        direction = 'up';
      }
    }
    
    // Only update if direction changed or we've waited long enough since last scroll
    const now = Date.now();
    if (direction !== joystickDirection || (direction && now - lastScrollTime.current > 200)) {
      setJoystickDirection(direction);
      
      // Scroll based on direction
      if (direction === 'up') {
        smoothScroll(-scrollDistance);
        lastScrollTime.current = now;
      } else if (direction === 'down') {
        smoothScroll(scrollDistance);
        lastScrollTime.current = now;
      }
    }
  };

  const handleJoystickRelease = () => {
    const knob = joystickKnobRef.current;
    if (knob) {
      // Add transition for smooth return to center
      knob.style.transition = 'transform 0.2s ease-out';
      knob.style.transform = 'translate(0, 0)';
      
      // Remove transition after animation completes
      setTimeout(() => {
        if (knob) knob.style.transition = '';
      }, 200);
    }
    
    setJoystickActive(false);
    setJoystickDirection(null);
  };

  // Mouse/touch event handlers for joystick
  const handleMouseDown = (e: React.MouseEvent) => {
    const joystick = joystickRef.current;
    if (!joystick) return;
    
    const rect = joystick.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setJoystickActive(true);
    handleJoystickMove(x, y);
    
    // Add a CSS class for visual feedback
    joystick.classList.add('active');
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const joystick = joystickRef.current;
    if (!joystick || !e.touches[0]) return;
    
    const rect = joystick.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;
    
    setJoystickActive(true);
    handleJoystickMove(x, y);
    
    // Add a CSS class for visual feedback
    joystick.classList.add('active');
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!joystickActive || !joystickRef.current) return;
    
    const rect = joystickRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    handleJoystickMove(x, y);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!joystickActive || !joystickRef.current || !e.touches[0]) return;
    
    const rect = joystickRef.current.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;
    
    handleJoystickMove(x, y);
  };

  const handleMouseUp = () => {
    if (!joystickActive) return;
    
    const joystick = joystickRef.current;
    if (joystick) {
      joystick.classList.remove('active');
    }
    
    handleJoystickRelease();
  };

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
  };
  
  const handleJoystickUp = () => {
    setJoystickActive(false);
    setJoystickDirection(null);
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
                  boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.6)'
                }}
              >
                {/* Xbox-like joystick inner dot */}
                <div 
                  ref={joystickKnobRef}
                  className="w-[26px] h-[26px] rounded-full bg-[#353b5a]/80"
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleTouchStart}
                />
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
