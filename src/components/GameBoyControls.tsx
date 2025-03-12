import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, 
  Heart, 
  Camera,
  MessageCircle, 
  Trophy, 
  UserPlus, 
  X, 
  Home, 
  Search, 
  Bell, 
  Upload, 
  User,
  TrendingUp,
  Settings,
  Bookmark,
  Video,
  Award,
  Monitor
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface GameBoyControlsProps {
  currentPostId?: string;
}

interface Window {
  continuousScrollTimer: NodeJS.Timeout | null;
}

declare global {
  interface Window {
    continuousScrollTimer: NodeJS.Timeout | null;
  }
}

// Add the property to the window object if it doesn't exist
if (typeof window !== 'undefined' && window.continuousScrollTimer === undefined) {
  window.continuousScrollTimer = null;
}

const GameBoyControls: React.FC<GameBoyControlsProps> = ({ currentPostId: propCurrentPostId }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [currentPath, setCurrentPath] = useState(location.pathname);
  const [currentPostId, setCurrentPostId] = useState<string | null>(propCurrentPostId || null);
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickDirection, setJoystickDirection] = useState<'up' | 'down' | 'left' | 'right' | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [trophyStatus, setTrophyStatus] = useState(false);
  const [feedTrophyCount, setFeedTrophyCount] = useState(0);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const [pulsating, setPulsating] = useState(false);
  const [glowing, setGlowing] = useState(true);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; opacity: number; size: number; color: string }>>([]);
  const [buttonsAnimated, setButtonsAnimated] = useState(false);
  const lastScrollTime = useRef<number>(0);
  const joystickRef = useRef<HTMLDivElement>(null);
  const joystickKnobRef = useRef<HTMLDivElement>(null);

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

  // For smooth scrolling with enhanced physics
  const scrollDistance = 150; // Increased from original value for more noticeable scrolling
  const scrollDuration = 200; // Reduced from 250 for more immediate scrolling
  const scrollCooldown = 150; // Reduced cooldown for better responsiveness
  const continuousScrollInterval = 150; // Faster interval for continuous scrolling when joystick is held

  // Enhanced animation for smooth scrolling with cleaner motion
  const smoothScroll = (distance: number) => {
    const now = Date.now();
    // Add cooldown to prevent rapid scrolling but make it more responsive
    if (now - lastScrollTime.current < scrollCooldown) return;
    lastScrollTime.current = now;
      
    console.log(`Smooth scrolling ${distance < 0 ? 'UP' : 'DOWN'} by ${Math.abs(distance)}px`);
    
    // Use immediate scrolling for better responsiveness on mobile
    window.scrollBy({
      top: distance,
      behavior: 'smooth'
    });
  };

  // Joystick direction action handler with enhanced scrolling
  const handleJoystickAction = (direction: 'up' | 'down' | 'left' | 'right') => {
    setJoystickDirection(direction);
    console.log(`Joystick direction action: ${direction}`);
    
    // Clear any existing continuous scroll interval
    const clearContinuousScroll = () => {
      if (window.continuousScrollTimer) {
        clearInterval(window.continuousScrollTimer);
        window.continuousScrollTimer = null;
      }
    };
    clearContinuousScroll();
    
    // Enhanced scroll behavior based on direction
    if (direction === 'up') {
      smoothScroll(-scrollDistance); // Scroll up (negative distance)
      
      // Subtle visual feedback (reduced duration and opacity)
      toast.info('Scrolling up', { 
        duration: 200, 
        position: 'top-center', 
        icon: '⬆️',
        style: { opacity: '0.7', fontSize: '0.9rem' }
      });
      
      // Start continuous scrolling if joystick remains active
      if (joystickActive) {
        window.continuousScrollTimer = setInterval(() => {
          if (joystickActive && joystickDirection === 'up') {
            smoothScroll(-scrollDistance);
          } else {
            clearContinuousScroll();
          }
        }, continuousScrollInterval);
      }
    } else if (direction === 'down') {
      smoothScroll(scrollDistance); // Scroll down (positive distance)
      
      // Subtle visual feedback (reduced duration and opacity)
      toast.info('Scrolling down', { 
        duration: 200, 
        position: 'top-center', 
        icon: '⬇️',
        style: { opacity: '0.7', fontSize: '0.9rem' }
      });
      
      // Start continuous scrolling if joystick remains active
      if (joystickActive) {
        window.continuousScrollTimer = setInterval(() => {
          if (joystickActive && joystickDirection === 'down') {
            smoothScroll(scrollDistance);
          } else {
            clearContinuousScroll();
          }
        }, continuousScrollInterval);
      }
    } else if (direction === 'left') {
      // Handle left action
      if (location.pathname.includes('/post/') && location.pathname !== '/post/new') {
        // Navigate to previous post if on a post page
        navigate(-1);
        toast.info('Previous post', { duration: 1000, position: 'top-center' });
      } else {
        // Provide feedback
        toast.info('Swipe left', { duration: 500, position: 'top-center', icon: '⬅️' });
      }
    } else if (direction === 'right') {
      // Handle right action
      if (location.pathname === '/') {
        // Navigate to next post on home page
        const posts = document.querySelectorAll('[data-post-id]');
        if (posts.length > 0 && currentPostId) {
          const currentIndex = Array.from(posts).findIndex(
            post => post.getAttribute('data-post-id') === currentPostId
          );
          if (currentIndex < posts.length - 1) {
            const nextPost = posts[currentIndex + 1];
            const nextPostId = nextPost.getAttribute('data-post-id');
            if (nextPostId) {
              setCurrentPostId(nextPostId);
              nextPost.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }
        }
      }
    }
  };

  // Handler for CLIPT button click
  const handleCliptButtonClick = () => {
    // Navigate to the Clipts page (restore original functionality)
    navigate('/clipts');
    toast.info('View Clipts');
  };

  // Handler for post button click
  const handlePost = () => {
    console.log('Navigating to post creation page');
    // Use absolute path with leading slash
    navigate('/post/new');
    toast.info('Create a new post');
  };

  // Handler for menu button click
  const handleMenu = () => {
    setMenuOpen(!menuOpen);
    console.log('Toggling menu:', !menuOpen);
  };

  // Handler for like button click
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

  // Handler for comment button click
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

  // Handler for trophy button click
  const handleTrophy = async () => {
    if (!currentPostId) {
      console.error('Cannot trophy with no post ID');
      toast.error('Could not find post to trophy');
      return;
    }
    
    console.log('Trophy clicked for post:', currentPostId);
    
    // Visual feedback on button press
    const trophyButton = document.querySelector(`.diamond-buttons [data-action="trophy"]`);
    if (trophyButton) {
      trophyButton.classList.add('button-press');
      setTimeout(() => {
        trophyButton.classList.remove('button-press');
      }, 300);
    }
    
    // Disable double-clicking
    trophyButton?.setAttribute('disabled', 'true');
    setTimeout(() => {
      trophyButton?.removeAttribute('disabled');
    }, 1000);
    
    try {
      // Get current user
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        toast.error('Please log in to vote');
        return;
      }
      
      const userId = session.session.user.id;
      
      console.log(`Attempting to update trophy for post ${currentPostId} by user ${userId}`);
      
      // Only check clip_votes table for consistency
      const { data: existingVotes, error: voteCheckError } = await supabase
        .from('clip_votes')
        .select('id')
        .eq('post_id', currentPostId)
        .eq('user_id', userId);
      
      if (voteCheckError) {
        console.error('Error checking existing votes:', voteCheckError);
        throw voteCheckError;
      }
      
      // Determine if user has already voted
      const hasVote = existingVotes && existingVotes.length > 0;
      console.log('Current vote status:', hasVote);
      
      // Update UI and toggle vote
      setTrophyStatus(!hasVote);
      
      if (hasVote) {
        // Remove vote
        const { error: removeError } = await supabase
          .from('clip_votes')
          .delete()
          .eq('post_id', currentPostId)
          .eq('user_id', userId);
        
        if (removeError) {
          console.error('Error removing vote:', removeError);
          throw removeError;
        }
        
        console.log('Vote removed successfully');
        toast.success('Trophy removed');
        
      } else {
        // Add vote
        const { error: addError } = await supabase
          .from('clip_votes')
          .insert({
            post_id: currentPostId,
            user_id: userId,
            created_at: new Date().toISOString()
          });
        
        if (addError) {
          console.error('Error adding vote:', addError);
          throw addError;
        }
        
        console.log('Vote added successfully');
        toast.success('Trophy awarded!');
      }
      
      // Get accurate count from database
      const { count, error: countError } = await supabase
        .from('clip_votes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', currentPostId);
      
      if (countError) {
        console.error('Error getting accurate count:', countError);
      } else {
        console.log('Accurate trophy count:', count);
        // Update trophy count in local state
        setFeedTrophyCount(count || 0);
      }
      
      // Dispatch event to notify other components
      const trophyUpdateEvent = new CustomEvent('trophy-update', {
        detail: {
          postId: currentPostId,
          count: count || 0,
          active: !hasVote
        }
      });
      window.dispatchEvent(trophyUpdateEvent);
      
      // Also dispatch with the exact same event name as in PostItem
      document.dispatchEvent(new CustomEvent('refresh-post', {
        detail: { postId: currentPostId }
      }));
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      
      // Force update the UI on all pages that show posts
      setTimeout(() => {
        window.dispatchEvent(new Event('trophy-count-update'));
      }, 500);
    } catch (error) {
      console.error('Error handling trophy vote:', error);
      toast.error('Failed to update trophy status');
      
      // On error, get the true state from the database
      try {
        const { data: voteCheck } = await supabase
          .from('clip_votes')
          .select('id')
          .eq('post_id', currentPostId)
          .eq('user_id', session?.session?.user?.id);
          
        const { count } = await supabase
          .from('clip_votes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', currentPostId);
        
        // Update UI with accurate state from database
        const hasVote = voteCheck && voteCheck.length > 0;
        setTrophyStatus(hasVote);
        setFeedTrophyCount(count || 0);
        
        console.log('Restored state from database:', { hasVote, count });
      } catch (stateError) {
        console.error('Error getting state from database:', stateError);
      }
    }
  };

  // Handler for follow button click
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

  // Handle joystick movement with enhanced detection for up/down scrolling
  const handleJoystickMove = (x: number, y: number) => {
    if (!joystickRef.current || !joystickKnobRef.current) return;
    
    const joystickRect = joystickRef.current.getBoundingClientRect();
    const centerX = joystickRect.width / 2;
    const centerY = joystickRect.height / 2;
    
    const deltaX = x - centerX;
    const deltaY = y - centerY;
    
    // Calculate distance from center
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const maxDistance = joystickRect.width / 2 * 0.8;
    
    // Normalize the delta values
    const normDeltaX = deltaX / maxDistance;
    const normDeltaY = deltaY / maxDistance;
    
    // Constrain movement to joystick bounds
    const constrainedDistance = Math.min(distance, maxDistance);
    const angle = Math.atan2(deltaY, deltaX);
    const constrainedX = Math.cos(angle) * constrainedDistance;
    const constrainedY = Math.sin(angle) * constrainedDistance;
    
    // Apply movement to joystick knob with enhanced animation
    joystickKnobRef.current.style.transition = distance > 0 ? 'none' : 'transform 0.2s ease-out';
    joystickKnobRef.current.style.transform = `translate3d(${constrainedX}px, ${constrainedY}px, 0) scale(${1 + constrainedDistance / maxDistance * 0.1})`;
    
    // Visual trail effect
    const createTrail = () => {
      const trail = document.createElement('div');
      trail.className = 'joystick-trail';
      trail.style.cssText = `
        position: absolute;
        width: 20px;
        height: 20px;
        background: radial-gradient(circle, rgba(153, 102, 255, 0.3) 0%, rgba(153, 102, 255, 0) 70%);
        border-radius: 50%;
        z-index: 1;
        top: ${centerY + constrainedY - 10}px;
        left: ${centerX + constrainedX - 10}px;
        animation: joystick-trail 0.5s ease-out forwards;
        pointer-events: none;
      `;
      
      joystickRef.current.appendChild(trail);
      
      setTimeout(() => {
        if (joystickRef.current && joystickRef.current.contains(trail)) {
          joystickRef.current.removeChild(trail);
        }
      }, 400);
    };
    
    // Create trail only for significant movements
    if (distance > maxDistance * 0.5) {
      createTrail();
    }
    
    // Determine joystick direction for UI feedback with enhanced sensitivity
    const thresholdRelative = maxDistance * 0.15; // More sensitive threshold for better detection
    
    // Add the joystick-active class for glow effect
    joystickRef.current.classList.add('joystick-active');
    
    // Clear all direction classes first for cleaner transitions
    joystickRef.current.classList.remove('direction-up', 'direction-down', 'direction-left', 'direction-right');
    
    // Enhanced vertical bias: Give preference to vertical movements for easier scrolling
    if (Math.abs(normDeltaY) > Math.abs(normDeltaX) * 0.5) { // Reduced to detect vertical more easily
      // Vertical movement detected - up or down
      if (normDeltaY > thresholdRelative) {
        joystickRef.current.classList.add('direction-down');
        if (normDeltaY > maxDistance * 0.2 && joystickDirection !== 'down') { // More sensitive
          handleJoystickAction('down');
          console.log('Triggering DOWN movement', normDeltaY);
        }
      } else if (normDeltaY < -thresholdRelative) {
        joystickRef.current.classList.add('direction-up');
        if (normDeltaY < -maxDistance * 0.2 && joystickDirection !== 'up') { // More sensitive
          handleJoystickAction('up');
          console.log('Triggering UP movement', normDeltaY);
        }
      }
    } else {
      // Horizontal movement - no change needed
      if (normDeltaX > thresholdRelative) {
        joystickRef.current.classList.add('direction-right');
        if (normDeltaX > maxDistance * 0.4 && joystickDirection !== 'right') {
          handleJoystickAction('right');
        }
      } else if (normDeltaX < -thresholdRelative) {
        joystickRef.current.classList.add('direction-left');
        if (normDeltaX < -maxDistance * 0.4 && joystickDirection !== 'left') {
          handleJoystickAction('left');
        }
      }
    }
  };

  // Joystick release with enhanced spring back animation
  const handleJoystickRelease = () => {
    if (!joystickRef.current || !joystickKnobRef.current) return;
    
    setJoystickActive(false);
    setJoystickDirection(null);
    
    // Enhanced spring-back effect
    joystickKnobRef.current.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
    joystickKnobRef.current.style.transform = 'translate3d(0, 0, 0) scale(1)';
    
    joystickRef.current.classList.remove('joystick-active', 'direction-up', 'direction-down', 'direction-left', 'direction-right');
  };

  // Mouse and touch event handlers for joystick
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

  // Add global event listeners for joystick movement
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, [joystickActive, joystickDirection]);

  // Handlers for button clicks
  const handleLikeClick = handleLike;
  const handleCommentClick = handleComment;
  const handleTrophyClick = handleTrophy;
  const handleFollowClick = handleFollow;

  const handleJoystickUp = () => {
    setJoystickActive(false);
    setJoystickDirection(null);
  };

  // Navigation helper
  const navigateTo = (path: string) => {
    navigate(path);
    setMenuOpen(false);
  };

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

  // Add animation keyframes with enhanced visual effects
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes pulse-glow {
        0% { box-shadow: 0 0 15px rgba(102, 47, 161, 0.6); }
        33% { box-shadow: 0 0 25px rgba(102, 47, 161, 0.8); }
        66% { box-shadow: 0 0 35px rgba(147, 51, 234, 0.9); }
        100% { box-shadow: 0 0 15px rgba(102, 47, 161, 0.6); }
      }
      
      @keyframes float {
        0% { transform: translateY(0px) rotate(0deg) scale(1); }
        25% { transform: translateY(-4px) rotate(-1deg) scale(1.02); }
        75% { transform: translateY(2px) rotate(1deg) scale(0.98); }
        100% { transform: translateY(0px) rotate(0deg) scale(1); }
      }
      
      @keyframes joystick-pulse {
        0% { box-shadow: 0 0 5px rgba(102, 47, 161, 0.3); }
        50% { box-shadow: 0 0 15px rgba(147, 51, 234, 0.5); }
        100% { box-shadow: 0 0 5px rgba(102, 47, 161, 0.3); }
      }
      
      @keyframes joystick-trail {
        0% { opacity: 0.7; transform: scale(0.9); }
        100% { opacity: 0; transform: scale(1.5); }
      }
      
      .joystick-active {
        animation: joystick-pulse 1.5s infinite ease-in-out;
        transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
      }
      
      .direction-up:after, .direction-down:after, .direction-left:after, .direction-right:after {
        content: '';
        position: absolute;
        width: 40%;
        height: 40%;
        border-radius: 50%;
        background: rgba(154, 95, 230, 0.3);
        z-index: -1;
      }
      
      .direction-up:after {
        top: 5%;
        left: 50%;
        transform: translateX(-50%);
      }
      
      .direction-down:after {
        bottom: 5%;
        left: 50%;
        transform: translateX(-50%);
      }
      
      .direction-left:after {
        left: 5%;
        top: 50%;
        transform: translateY(-50%);
      }
      
      .direction-right:after {
        right: 5%;
        top: 50%;
        transform: translateY(-50%);
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="bg-[#10101e]/95 backdrop-blur-lg pb-6 pt-4 px-6 md:px-16 lg:px-24 w-full">
        {/* Keep currentPostId tracking but make it invisible by setting opacity to 0 */}
        {currentPostId && (
          <div className="absolute top-0 left-0 right-0 transform -translate-y-full opacity-0 pointer-events-none">
            Active: Post #{currentPostId.substring(0, 8)}
          </div>
        )}
        
        <div className="grid grid-cols-3 items-center justify-items-center">
          {/* Left joystick */}
          <div className="flex justify-center">
            <div 
              ref={joystickRef}
              className="w-[55px] h-[55px] rounded-full bg-[#1E1E30] border border-[#2E2E40]/50 touch-none relative shadow-inner overflow-hidden"
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              onMouseUp={() => handleJoystickRelease()}
              onTouchEnd={() => handleJoystickRelease()}
            >
              {/* Subtle joystick guides */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-[1px] h-full bg-[#3A3A50]/20"></div>
                <div className="h-[1px] w-full bg-[#3A3A50]/20"></div>
              </div>
              
              {/* Joystick handle with improved styling */}
              <div 
                ref={joystickKnobRef} 
                className="w-[30px] h-[30px] rounded-full bg-gradient-to-br from-[#353b5a] to-[#252a40] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border border-[#4c4f64]/50 shadow-md z-10 joystick-active"
              >
                <div className="absolute inset-2 rounded-full bg-[#20233A]/40"></div>
              </div>
            </div>
          </div>
          
          {/* Center - CLIPT button and controls */}
          <div className="flex flex-col items-center justify-center space-y-4">
            {/* Ultra enhanced CLIPT button with advanced effects */}
            <button 
              onClick={handleCliptButtonClick}
              className="relative w-[72px] h-[72px] rounded-full flex items-center justify-center clipt-button-hover clipt-button-active transform transition-all duration-300 overflow-hidden"
              style={{
                background: 'radial-gradient(circle at center, #9A5FE6 0%, #7840C0 35%, #662FA1 60%, #561D99 85%)',
                boxShadow: '0 0 25px rgba(122, 59, 192, 0.7), inset 0 0 18px rgba(255, 255, 255, 0.25)',
                animation: 'pulse-glow 4s infinite, float 8s ease-in-out infinite'
              }}
            >
              {/* Animated particle overlay with more particles */}
              <div className="clipt-particles absolute inset-0 opacity-0 transition-opacity duration-300" style={{ perspective: '800px' }}>
                {[...Array(15)].map((_, i) => (
                  <div 
                    key={i}
                    className="absolute rounded-full"
                    style={{
                      width: `${Math.random() * 10 + 2}px`,
                      height: `${Math.random() * 10 + 2}px`,
                      background: `rgba(${147 + Math.random() * 50}, ${51 + Math.random() * 40}, ${234 + Math.random() * 20}, ${0.5 + Math.random() * 0.5})`,
                      top: `${Math.random() * 100}%`,
                      left: `${Math.random() * 100}%`,
                      filter: 'blur(0.5px)',
                      animation: `float ${3 + Math.random() * 5}s infinite ease-in-out, rotate ${8 + Math.random() * 10}s infinite linear`
                    }}
                  />
                ))}
              </div>
              
              {/* Interactive multi-layer ripple effect */}
              {Array.from({ length: 3 }, (_, i) => (
                <div 
                  key={i}
                  className="absolute w-full h-full rounded-full opacity-0 pointer-events-none"
                  style={{
                    border: `${1 + i * 0.5}px solid rgba(${147 + i * 10}, ${51 + i * 5}, ${234 - i * 10}, ${0.3 - i * 0.05})`,
                    animation: `ripple ${2 + i * 0.7}s linear infinite`,
                    animationDelay: `${i * 0.4}s`
                  }}
                />
              ))}
              
              {/* Animated gradient overlay */}
              <div className="absolute inset-0 rounded-full overflow-hidden opacity-50" style={{ mixBlendMode: 'overlay' }}>
                <div 
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(120deg, rgba(154, 95, 230, 0) 20%, rgba(154, 95, 230, 0.4) 50%, rgba(154, 95, 230, 0) 80%)',
                    backgroundSize: '200% 200%',
                    animation: 'bgShift 5s ease infinite'
                  }}
                />
              </div>
              
              {/* Inner glow effect with animated highlight */}
              <div className="absolute inset-1 rounded-full bg-gradient-to-b from-[#9A5FE6]/30 to-transparent overflow-hidden">
                <div 
                  className="absolute w-full h-[35%] bg-gradient-to-b from-white/15 to-transparent"
                  style={{
                    top: '-15%',
                    transform: 'rotate(35deg) translateZ(0)',
                    animation: 'float 6s ease-in-out infinite'
                  }}
                />
              </div>
              
              {/* Pulsing inner circle */}
              <div className="clipt-inner-circle absolute inset-[3px] rounded-full border-2 border-[#9A5FE6]/20"></div>
              
              {/* Multi-layer holographic ring */}
              <div className="absolute inset-0 rounded-full border border-[#9A5FE6]/30">
                <div className="absolute inset-[-1px] rounded-full border border-[#9A5FE6]/10"></div>
                <div className="absolute inset-[-2px] rounded-full border border-[#9A5FE6]/5"></div>
                <div className="absolute inset-[-3px] rounded-full border border-[#9A5FE6]/2"></div>
              </div>
              
              {/* Ultra fancy text with enhanced effect */}
              <span 
                className="clipt-text font-bold text-base relative z-10"
                style={{ 
                  color: '#F0E6FF',
                  textShadow: '0 2px 5px rgba(0,0,0,0.3)',
                  letterSpacing: '0.3px'
                }}
              >
                CLIPT
              </span>
            </button>
            
            {/* Sub controls row */}
            <div className="flex space-x-10">
              <button 
                onClick={handleMenu}
                className="w-[30px] h-[30px] rounded-full bg-[#20203A] flex items-center justify-center hover:bg-[#252545] transition-colors duration-200 shadow-inner"
              >
                <Menu size={14} className="text-gray-400" />
              </button>
              
              <button 
                onClick={handlePost}
                className="w-[30px] h-[30px] rounded-full bg-[#20203A] flex items-center justify-center hover:bg-[#252545] transition-colors duration-200 shadow-inner"
              >
                <Camera size={14} className="text-gray-400" />
              </button>
            </div>
          </div>
          
          {/* Right - Action buttons in diamond pattern */}
          <div className="relative w-[100px] h-[100px]">
            {/* Like button */}
            <button 
              className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[34px] h-[34px] rounded-full bg-[#20203A] border border-red-500/30 flex items-center justify-center hover:bg-[#252545] hover:border-red-500/60 active:scale-95 transition-all duration-200"
              data-action="like"
              onClick={handleLike}
            >
              <Heart size={16} className="text-red-500" />
            </button>
            
            {/* Comment button */}
            <button 
              className="absolute right-0 top-1/2 transform -translate-y-1/2 w-[34px] h-[34px] rounded-full bg-[#20203A] border border-blue-500/30 flex items-center justify-center hover:bg-[#252545] hover:border-blue-500/60 active:scale-95 transition-all duration-200"
              data-action="comment"
              onClick={handleComment}
            >
              <MessageCircle size={16} className="text-blue-400" />
            </button>
            
            {/* Trophy button */}
            <button 
              className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[34px] h-[34px] rounded-full bg-[#20203A] border border-yellow-500/30 flex items-center justify-center hover:bg-[#252545] hover:border-yellow-500/60 active:scale-95 transition-all duration-200"
              data-action="trophy"
              onClick={handleTrophy}
            >
              <Trophy size={16} className="text-yellow-400" />
            </button>
            
            {/* Follow button */}
            <button 
              className="absolute left-0 top-1/2 transform -translate-y-1/2 w-[34px] h-[34px] rounded-full bg-[#20203A] border border-green-500/30 flex items-center justify-center hover:bg-[#252545] hover:border-green-500/60 active:scale-95 transition-all duration-200"
              data-action="follow"
              onClick={handleFollow}
            >
              <UserPlus size={16} className="text-green-500" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Fixed and enhanced Menu dialog with all requested pages */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-center justify-center">
          <div className="absolute inset-x-0 bottom-20 bg-[#161925] border-t border-blue-500/30">
            <div className="max-w-md mx-auto p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white text-lg font-semibold">Menu</h3>
                <button 
                  className="text-gray-400 hover:text-white" 
                  onClick={() => setMenuOpen(false)}
                >
                  <X size={20} />
                </button>
              </div>
              
              {/* Clear and visible grid layout with exactly the requested navigation pages */}
              <div className="grid grid-cols-2 gap-4">
                <button 
                  className="flex items-center space-x-3 p-3 rounded bg-[#20213A] hover:bg-[#30314A] transition-colors"
                  onClick={() => {
                    navigate('/');
                    setMenuOpen(false);
                  }}
                >
                  <Home size={20} className="text-yellow-400" />
                  <span className="text-white font-medium">Home</span>
                </button>
                
                <button 
                  className="flex items-center space-x-3 p-3 rounded bg-[#20213A] hover:bg-[#30314A] transition-colors"
                  onClick={() => {
                    navigate('/discovery');
                    setMenuOpen(false);
                  }}
                >
                  <Search size={20} className="text-green-400" />
                  <span className="text-white font-medium">Discovery</span>
                </button>
                
                <button 
                  className="flex items-center space-x-3 p-3 rounded bg-[#20213A] hover:bg-[#30314A] transition-colors"
                  onClick={() => {
                    navigate('/profile');
                    setMenuOpen(false);
                  }}
                >
                  <User size={20} className="text-blue-400" />
                  <span className="text-white font-medium">Profile</span>
                </button>
                
                <button 
                  className="flex items-center space-x-3 p-3 rounded bg-[#20213A] hover:bg-[#30314A] transition-colors"
                  onClick={() => {
                    navigate('/settings');
                    setMenuOpen(false);
                  }}
                >
                  <Settings size={20} className="text-gray-400" />
                  <span className="text-white font-medium">Settings</span>
                </button>
                
                <button 
                  className="flex items-center space-x-3 p-3 rounded bg-[#20213A] hover:bg-[#30314A] transition-colors"
                  onClick={() => {
                    navigate('/clipts');
                    setMenuOpen(false);
                  }}
                >
                  <Video size={20} className="text-purple-400" />
                  <span className="text-white font-medium">Clipts</span>
                </button>
                
                <button 
                  className="flex items-center space-x-3 p-3 rounded bg-[#20213A] hover:bg-[#30314A] transition-colors"
                  onClick={() => {
                    navigate('/top-clipts');
                    setMenuOpen(false);
                  }}
                >
                  <Award size={20} className="text-amber-400" />
                  <span className="text-white font-medium">Top Clipts</span>
                </button>
                
                <button 
                  className="flex items-center space-x-3 p-3 rounded bg-[#20213A] hover:bg-[#30314A] transition-colors bg-opacity-100"
                  onClick={() => {
                    navigate('/streaming');
                    setMenuOpen(false);
                  }}
                >
                  <Monitor size={20} className="text-red-400" />
                  <span className="text-white font-medium">Streaming</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameBoyControls;
