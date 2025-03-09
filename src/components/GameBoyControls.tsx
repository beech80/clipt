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
    
    // Apply the position to the knob with smoother transition
    knob.style.transition = distance > 5 ? 'transform 0.1s ease-out' : '';
    knob.style.transform = `translate(${newX}px, ${newY}px)`;
    
    // Determine direction
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    let direction: 'up' | 'down' | 'left' | 'right' | null = null;
    
    // Only register direction if joystick is moved significantly
    // Lower threshold to make it more responsive
    if (distance > maxDistance * 0.35) {
      if (angle > -45 && angle <= 45) {
        direction = 'right';
      } else if (angle > 45 && angle <= 135) {
        direction = 'down';
      } else if (angle > 135 || angle <= -135) {
        direction = 'left';
      } else {
        direction = 'up';
      }
      
      // Add visual feedback based on direction
      knob.className = `w-[30px] h-[30px] rounded-full bg-[#4a4d5e] border-[1px] border-[#4c4f64] direction-${direction}`;
    } else {
      knob.className = 'w-[30px] h-[30px] rounded-full bg-[#4a4d5e] border-[1px] border-[#4c4f64]';
    }
    
    // Only update if direction changed or we've waited long enough since last scroll
    const now = Date.now();
    if (direction !== joystickDirection || (direction && (direction === 'up' || direction === 'down') && now - lastScrollTime.current > 150)) {
      setJoystickDirection(direction);
      
      // Scroll based on direction - make up/down more responsive
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
  
  // Enhanced post detection with debugging
  useEffect(() => {
    // If a specific post ID is passed as a prop, always use that
    if (propCurrentPostId) {
      setCurrentPostId(propCurrentPostId);
      return;
    }
    
    // Define a function to find the most visible post
    const findVisiblePostId = () => {
      const posts = document.querySelectorAll('[data-post-id]');
      if (!posts.length) return;
      
      let mostVisiblePost = null;
      let maxVisibleArea = 0;
      const viewportHeight = window.innerHeight;
      
      posts.forEach(post => {
        const rect = post.getBoundingClientRect();
        const postId = post.getAttribute('data-post-id');
        
        // Skip if post is not visible or too small in the viewport
        if (rect.bottom < 100 || rect.top > viewportHeight - 100) {
          return;
        }
        
        // Calculate visible area
        const visibleTop = Math.max(0, rect.top);
        const visibleBottom = Math.min(viewportHeight, rect.bottom);
        const visibleHeight = visibleBottom - visibleTop;
        const visibleRatio = visibleHeight / rect.height;
        
        // Update if this post is more visible than the current most visible
        if (visibleRatio > maxVisibleArea) {
          maxVisibleArea = visibleRatio;
          mostVisiblePost = post;
        }
      });
      
      // Only update if we have a post that's significantly visible (>30%)
      if (mostVisiblePost && maxVisibleArea > 0.3) {
        const postId = mostVisiblePost.getAttribute('data-post-id');
        if (postId && postId !== currentPostId) {
          console.log(`Selecting post: ${postId}`);
          setCurrentPostId(postId);
          
          // Add visual indicator to highlight the currently selected post
          posts.forEach(p => {
            if (p.getAttribute('data-post-id') === postId) {
              p.classList.add('currently-selected-post');
              
              // Add a subtle pulse animation to show which post is active
              p.classList.add('pulse-highlight');
              setTimeout(() => {
                p.classList.remove('pulse-highlight');
              }, 1000);
            } else {
              p.classList.remove('currently-selected-post');
              p.classList.remove('pulse-highlight');
            }
          });
          
          // Update UI to show which post is selected (small indicator on controller)
          const postIndicator = document.getElementById('current-post-indicator');
          if (postIndicator) {
            postIndicator.textContent = `Post #${postId}`;
            postIndicator.style.opacity = '1';
            setTimeout(() => {
              postIndicator.style.opacity = '0.5';
            }, 2000);
          }
          
          // Also update any internal state in the app
          document.dispatchEvent(new CustomEvent('post-selected', {
            detail: { postId }
          }));
        }
      }
    };
    
    // Run immediately and set up event listeners
    findVisiblePostId();
    
    // Use both scroll and a timer to ensure we're updating regularly
    window.addEventListener('scroll', findVisiblePostId);
    window.addEventListener('resize', findVisiblePostId);
    
    // Check more frequently (300ms) for more responsive updates
    const intervalId = setInterval(findVisiblePostId, 300);
    
    return () => {
      window.removeEventListener('scroll', findVisiblePostId);
      window.removeEventListener('resize', findVisiblePostId);
      clearInterval(intervalId);
    };
  }, [currentPostId, propCurrentPostId]);

  // Handler for like button with improved triggering of post actions
  const handleLike = async () => {
    if (!currentPostId) {
      toast.error('No post selected');
      return;
    }
    
    console.log('Liking post:', currentPostId);
    
    // Find the actual like button on the post and click it to trigger all the necessary logic
    const targetPost = document.querySelector(`[data-post-id="${currentPostId}"]`);
    if (targetPost) {
      const likeButton = targetPost.querySelector('.like-button');
      if (likeButton) {
        // Visual feedback on controller button
        const controllerLikeButton = document.querySelector(`.diamond-buttons [data-action="like"]`);
        if (controllerLikeButton) {
          controllerLikeButton.classList.add('button-press');
          setTimeout(() => {
            controllerLikeButton.classList.remove('button-press');
          }, 300);
        }
        
        // Actually trigger the like button's click event
        likeButton.dispatchEvent(new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true
        }));
        return;
      }
    }
    
    // Fallback if direct button interaction doesn't work
    try {
      // Check if already liked
      const { data: currentUser } = await supabase.auth.getUser();
      const userId = currentUser?.user?.id;
      
      if (!userId) {
        toast.error('You need to be logged in to like posts');
        return;
      }
      
      const { data: existingLike, error: likeError } = await supabase
        .from('likes')
        .select('*')
        .eq('post_id', currentPostId)
        .eq('user_id', userId)
        .maybeSingle();
      
      if (likeError) {
        console.error('Error checking like status:', likeError);
      }
      
      if (existingLike) {
        // Unlike
        await supabase
          .from('likes')
          .delete()
          .eq('post_id', currentPostId)
          .eq('user_id', userId);
          
        toast.success('Removed like from post');
      } else {
        // Like
        await supabase
          .from('likes')
          .insert({
            post_id: currentPostId,
            user_id: userId,
            created_at: new Date().toISOString()
          });
          
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

  // Handler for comment button
  const handleComment = async () => {
    if (!currentPostId) {
      toast.error('No post selected');
      return;
    }
    
    console.log('Comment on post:', currentPostId);
    
    // Visual feedback on controller button
    const commentButton = document.querySelector(`.diamond-buttons [data-action="comment"]`);
    if (commentButton) {
      commentButton.classList.add('button-press');
      setTimeout(() => {
        commentButton.classList.remove('button-press');
      }, 300);
    }
    
    // Find the actual comment button on the post and click it
    const targetPost = document.querySelector(`[data-post-id="${currentPostId}"]`);
    if (targetPost) {
      const postCommentButton = targetPost.querySelector('.comment-button');
      if (postCommentButton) {
        postCommentButton.dispatchEvent(new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true
        }));
        return;
      }
    }
    
    // Fallback: use the existing global state to trigger the comment modal
    setCommentModalOpen(true);
  };

  // Handler for trophy button
  const handleTrophy = async () => {
    if (!currentPostId) {
      toast.error('No post selected');
      return;
    }
    
    console.log('Trophy for post:', currentPostId);
    
    // Visual feedback on controller button
    const trophyButton = document.querySelector(`.diamond-buttons [data-action="trophy"]`);
    if (trophyButton) {
      trophyButton.classList.add('button-press');
      setTimeout(() => {
        trophyButton.classList.remove('button-press');
      }, 300);
    }
    
    // Find the trophy button on the post and click it
    const targetPost = document.querySelector(`[data-post-id="${currentPostId}"]`);
    if (targetPost) {
      const postTrophyButton = targetPost.querySelector('.trophy-button');
      if (postTrophyButton) {
        postTrophyButton.dispatchEvent(new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true
        }));
        return;
      }
    }
    
    // Fallback if direct button interaction doesn't work
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      const userId = currentUser?.user?.id;
      
      if (!userId) {
        toast.error('You need to be logged in to vote for posts');
        return;
      }
      
      // Get post owner ID for notification
      const { data: post } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', currentPostId)
        .single();
      
      if (!post) {
        toast.error('Post not found');
        return;
      }
      
      const authorId = post.user_id;
      
      // Check if already voted
      const { data: existingVote } = await supabase
        .from('post_votes')
        .select('*')
        .eq('post_id', currentPostId)
        .eq('user_id', userId)
        .single();
      
      if (existingVote) {
        // Remove vote
        await supabase
          .from('post_votes')
          .delete()
          .eq('post_id', currentPostId)
          .eq('user_id', userId);
          
        toast.success('Removed vote from post');
      } else {
        // Add vote
        await supabase
          .from('post_votes')
          .insert({
            post_id: currentPostId,
            user_id: userId,
            created_at: new Date().toISOString()
          });
          
        // Create notification
        if (authorId !== userId) {
          await supabase
            .from('notifications')
            .insert({
              type: 'like',
              user_id: authorId,
              actor_id: userId,
              resource_id: currentPostId,
              resource_type: 'post',
              content: 'gave a trophy to your post',
              created_at: new Date().toISOString(),
              read: false
            });
        }
        
        toast.success('Voted for post');
      }
      
      // Trigger a refresh
      document.dispatchEvent(new CustomEvent('refresh-post', {
        detail: { postId: currentPostId }
      }));
    } catch (error) {
      console.error('Error voting for post:', error);
      toast.error('Failed to vote for post');
    }
  };

  // Handler for follow button
  const handleFollow = async () => {
    if (!currentPostId) {
      toast.error('No post selected');
      return;
    }
    
    console.log('Follow user of post:', currentPostId);
    
    // Visual feedback on controller button
    const followButton = document.querySelector(`.diamond-buttons [data-action="follow"]`);
    if (followButton) {
      followButton.classList.add('button-press');
      setTimeout(() => {
        followButton.classList.remove('button-press');
      }, 300);
    }
    
    // Find the follow button on the post and click it
    const targetPost = document.querySelector(`[data-post-id="${currentPostId}"]`);
    if (targetPost) {
      const postFollowButton = targetPost.querySelector('.follow-button');
      if (postFollowButton) {
        postFollowButton.dispatchEvent(new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true
        }));
        return;
      }
    }
    
    // Fallback if direct button interaction doesn't work
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      const userId = currentUser?.user?.id;
      
      if (!userId) {
        toast.error('You need to be logged in to follow users');
        return;
      }
      
      // Get post author info
      const { data: post } = await supabase
        .from('posts')
        .select('user_id, users:user_id(username)')
        .eq('id', currentPostId)
        .single();
      
      if (!post) {
        toast.error('Post not found');
        return;
      }
      
      const authorId = post.user_id;
      const authorUsername = post.users?.username;
      
      if (authorId === userId) {
        toast.error('You cannot follow yourself');
        return;
      }
      
      // Check if already following
      const { data: existingFollow } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', userId)
        .eq('following_id', authorId)
        .maybeSingle();
      
      if (existingFollow) {
        // Unfollow
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', userId)
          .eq('following_id', authorId);
          
        toast.success(`Unfollowed ${authorUsername || 'user'}`);
      } else {
        // Follow
        await supabase
          .from('follows')
          .insert({
            follower_id: userId,
            following_id: authorId,
            created_at: new Date().toISOString()
          });
          
        // Create notification
        await supabase
          .from('notifications')
          .insert({
            type: 'follow',
            user_id: authorId,
            actor_id: userId,
            resource_id: currentPostId,
            resource_type: 'post',
            content: 'started following you',
            created_at: new Date().toISOString(),
            read: false
          });
          
        toast.success(`Followed ${authorUsername || 'user'}`);
      }
    } catch (error) {
      console.error('Error following user:', error);
      toast.error('Failed to follow user');
    }
  };

  // Add CSS for button press animation
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .button-press {
        transform: scale(0.9) !important;
        box-shadow: 0 0 15px rgba(255, 255, 255, 0.3) !important;
        filter: brightness(1.2) !important;
      }
      
      .pulse-highlight {
        animation: pulse-border 1s ease-out;
      }
      
      .currently-selected-post {
        position: relative;
      }
      
      .currently-selected-post::after {
        content: '';
        position: absolute;
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
        border: 2px solid rgba(99, 102, 241, 0.5);
        border-radius: 8px;
        pointer-events: none;
        z-index: 1;
      }
      
      @keyframes pulse-border {
        0% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.5); }
        70% { box-shadow: 0 0 0 5px rgba(99, 102, 241, 0); }
        100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

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

  // Add CSS classes for direction indicators
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .direction-up { box-shadow: 0 -4px 6px rgba(49, 130, 206, 0.6); }
      .direction-down { box-shadow: 0 4px 6px rgba(49, 130, 206, 0.6); }
      .direction-left { box-shadow: -4px 0 6px rgba(49, 130, 206, 0.6); }
      .direction-right { box-shadow: 4px 0 6px rgba(49, 130, 206, 0.6); }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const joystickBaseStyle = {
    background: 'radial-gradient(circle at center, #2a2d3e 0%, #1a1c2c 70%)',
    boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.6), 0 0 5px rgba(76, 136, 239, 0.4)',
    border: '2px solid #353b5a',
  };
  
  const joystickKnobStyle = {
    background: 'radial-gradient(circle at center, #4a4d5e 0%, #353b5a 100%)',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3), 0 0 3px rgba(255, 255, 255, 0.1)',
    border: '1px solid #4c4f64',
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="bg-[#10101e]/95 backdrop-blur border-t border-[#353b5a]/50 pb-5 pt-5 px-2 md:px-16 lg:px-24 w-full">
        <div className="grid grid-cols-3 items-center">
          {/* Left joystick - redesigned for retro look */}
          <div className="flex justify-start pl-4">
            <div className="relative w-[68px] h-[68px] flex items-center justify-center">
              {/* Joystick base with retro styling */}
              <div 
                ref={joystickRef}
                className="w-[64px] h-[64px] rounded-full flex items-center justify-center"
                style={joystickBaseStyle}
              >
                {/* Circular directional guides - D-pad style overlay */}
                <div className="absolute w-full h-full pointer-events-none">
                  <div className="absolute top-[3px] left-1/2 transform -translate-x-1/2 w-[12px] h-[12px] bg-[#232538]/50 rounded-sm"></div>
                  <div className="absolute bottom-[3px] left-1/2 transform -translate-x-1/2 w-[12px] h-[12px] bg-[#232538]/50 rounded-sm"></div>
                  <div className="absolute left-[3px] top-1/2 transform -translate-y-1/2 w-[12px] h-[12px] bg-[#232538]/50 rounded-sm"></div>
                  <div className="absolute right-[3px] top-1/2 transform -translate-y-1/2 w-[12px] h-[12px] bg-[#232538]/50 rounded-sm"></div>
                </div>
                
                {/* Retro-modern joystick knob */}
                <div 
                  ref={joystickKnobRef}
                  className="w-[30px] h-[30px] rounded-full transition-all duration-150 z-10"
                  style={joystickKnobStyle}
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleTouchStart}
                >
                  {/* Inner detail for knob */}
                  <div className="w-full h-full rounded-full flex items-center justify-center">
                    <div className="w-[14px] h-[14px] rounded-full bg-[#232538]/30"></div>
                  </div>
                </div>
                
                {/* Add directional indicators with retro look */}
                <div 
                  className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/4 opacity-70 hover:opacity-100 cursor-pointer transition-all duration-200 hover:scale-110"
                  onClick={() => {
                    handleJoystickDown('up');
                    smoothScroll(-scrollDistance);
                    setTimeout(handleJoystickUp, 200);
                  }}
                >
                  <div className="w-5 h-5 flex items-center justify-center">
                    <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[8px] border-l-transparent border-r-transparent border-b-[#4c88ef]"></div>
                  </div>
                </div>
                
                <div 
                  className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/4 opacity-70 hover:opacity-100 cursor-pointer transition-all duration-200 hover:scale-110"
                  onClick={() => {
                    handleJoystickDown('down');
                    smoothScroll(scrollDistance);
                    setTimeout(handleJoystickUp, 200);
                  }}
                >
                  <div className="w-5 h-5 flex items-center justify-center">
                    <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-[#4c88ef]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Center - CLIPT button and post indicator */}
          <div className="flex flex-col items-center justify-center">
            <button 
              onClick={handleClipt}
              className={`relative w-[100px] h-[40px] rounded-full bg-[#1d1e2d] border-2 ${pulsating ? 'animate-pulse-border' : ''} flex items-center justify-center z-10 transform hover:scale-105 transition-all duration-300 active:scale-95 group`}
              style={{
                borderImage: 'linear-gradient(90deg, #6366F1, #EC4899) 1',
                boxShadow: glowing ? '0 0 15px rgba(124, 58, 237, 0.5)' : 'none',
              }}
            >
              <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-pink-500 group-hover:from-indigo-400 group-hover:to-pink-400">CLIPT</span>
              
              {/* Particle effects */}
              <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
                {particles.map(particle => (
                  <div 
                    key={particle.id}
                    className="absolute rounded-full animate-float-away"
                    style={{
                      left: `${particle.x}%`,
                      top: `${particle.y}%`,
                      width: `${particle.size}px`,
                      height: `${particle.size}px`,
                      backgroundColor: particle.color,
                      opacity: particle.opacity
                    }}
                  />
                ))}
              </div>
            </button>
            
            {/* Current post indicator */}
            <div id="current-post-indicator" className="text-[10px] text-gray-400 mt-1 opacity-50 transition-opacity duration-500">
              {currentPostId ? `Post #${currentPostId}` : 'No post selected'}
            </div>
          </div>
          
          {/* Right diamond buttons */}
          <div className="flex justify-end">
            <div className="flex flex-col items-center -mt-1">
              <div className="relative">
                {/* Diamond button layout - retro style */}
                <div className="relative diamond-buttons w-[130px] h-[130px]">
                  {/* Top button (Heart/Like) */}
                  <div 
                    className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[42px] h-[42px] rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110 active:scale-95 hover:shadow-[0_0_10px_rgba(239,68,68,0.5)]" 
                    onClick={handleLike}
                    data-tooltip={`Like Post ${currentPostId ? `#${currentPostId}` : ''}`}
                    data-action="like"
                    style={{
                      background: 'radial-gradient(circle at center, #3a2d3a 0%, #2a1d2a 100%)',
                      border: '2px solid rgba(239, 68, 68, 0.5)',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <Heart size={20} className="text-red-500 filter drop-shadow-sm" />
                  </div>
                  
                  {/* Left button (Message/Comment) */}
                  <div 
                    className="absolute top-1/2 left-0 transform -translate-y-1/2 w-[42px] h-[42px] rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110 active:scale-95 hover:shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                    onClick={handleComment}
                    data-tooltip={`Comment on Post ${currentPostId ? `#${currentPostId}` : ''}`}
                    data-action="comment"
                    style={{
                      background: 'radial-gradient(circle at center, #2a3a4a 0%, #1a2a3a 100%)',
                      border: '2px solid rgba(59, 130, 246, 0.5)',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <MessageCircle size={20} className="text-blue-500 filter drop-shadow-sm" />
                  </div>
                  
                  {/* Right button (Trophy) */}
                  <div 
                    className="absolute top-1/2 right-0 transform -translate-y-1/2 w-[42px] h-[42px] rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110 active:scale-95 hover:shadow-[0_0_10px_rgba(234,179,8,0.5)]" 
                    onClick={handleTrophy}
                    data-tooltip={`Vote for Post ${currentPostId ? `#${currentPostId}` : ''}`}
                    data-action="trophy"
                    style={{
                      background: 'radial-gradient(circle at center, #4a4a2a 0%, #3a3a1a 100%)',
                      border: '2px solid rgba(234, 179, 8, 0.5)',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <Trophy size={20} className="text-yellow-500 filter drop-shadow-sm" />
                  </div>
                  
                  {/* Bottom button (UserPlus/Follow) */}
                  <div 
                    className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[42px] h-[42px] rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110 active:scale-95 hover:shadow-[0_0_10px_rgba(34,197,94,0.5)]" 
                    onClick={handleFollow}
                    data-tooltip={`Follow Author of Post ${currentPostId ? `#${currentPostId}` : ''}`}
                    data-action="follow"
                    style={{
                      background: 'radial-gradient(circle at center, #2a4a3a 0%, #1a3a2a 100%)',
                      border: '2px solid rgba(34, 197, 94, 0.5)',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <UserPlus size={20} className="text-green-500 filter drop-shadow-sm" />
                  </div>
                </div>
                
                {/* Add a post indicator label */}
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 text-[10px] text-gray-400 w-full text-center">
                  {currentPostId ? `Active: Post #${currentPostId}` : 'No post selected'}
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
