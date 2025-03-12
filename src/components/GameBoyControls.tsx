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
  const scrollDistance = 300; // pixels to scroll per movement
  const scrollDuration = 250; // Reduced from 300 to make scrolling even more responsive
  const scrollCooldown = 250; // Reduced cooldown for better responsiveness

  // Enhanced animation for smooth scrolling with cleaner motion
  const smoothScroll = (distance: number) => {
    const now = Date.now();
    // Add cooldown to prevent rapid scrolling
    if (now - lastScrollTime.current < scrollCooldown) return;
    lastScrollTime.current = now;
      
    console.log(`Smooth scrolling ${distance < 0 ? 'UP' : 'DOWN'} by ${Math.abs(distance)}px`);
    
    const startPosition = window.scrollY;
    const startTime = performance.now();
    
    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / scrollDuration, 1);
      
      // Simplified easing function for more reliable and cleaner motion
      const easeOutQuad = 1 - Math.pow(1 - progress, 2);
      
      window.scrollTo({
        top: startPosition + distance * easeOutQuad,
        behavior: 'auto' // We're handling the smoothness ourselves
      });
      
      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      }
    };
    
    requestAnimationFrame(animateScroll);
  };

  // Joystick direction action handler with enhanced scrolling
  const handleJoystickAction = (direction: 'up' | 'down' | 'left' | 'right') => {
    setJoystickDirection(direction);
    console.log(`Joystick direction action: ${direction}`);
    
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
      
      // Schedule another scroll if joystick is still active in this direction
      if (joystickActive && joystickDirection === 'up') {
        setTimeout(() => {
          if (joystickActive && joystickDirection === 'up') {
            smoothScroll(-scrollDistance);
          }
        }, scrollCooldown);
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
      
      // Schedule another scroll if joystick is still active in this direction
      if (joystickActive && joystickDirection === 'down') {
        setTimeout(() => {
          if (joystickActive && joystickDirection === 'down') {
            smoothScroll(scrollDistance);
          }
        }, scrollCooldown);
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

  // Handlers for button clicks - all properly assigned
  const handleLikeClick = handleLike;
  const handleCommentClick = handleComment;
  const handleTrophyClick = handleTrophy;
  const handleFollowClick = handleFollow;

  const handleMenu = () => {
    setMenuOpen(true);
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
              onClick={handleLikeClick}
            >
              <Heart size={16} className="text-red-500" />
            </button>
            
            {/* Comment button */}
            <button 
              className="absolute right-0 top-1/2 transform -translate-y-1/2 w-[34px] h-[34px] rounded-full bg-[#20203A] border border-blue-500/30 flex items-center justify-center hover:bg-[#252545] hover:border-blue-500/60 active:scale-95 transition-all duration-200"
              data-action="comment"
              onClick={handleCommentClick}
            >
              <MessageCircle size={16} className="text-blue-400" />
            </button>
            
            {/* Trophy button */}
            <button 
              className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[34px] h-[34px] rounded-full bg-[#20203A] border border-yellow-500/30 flex items-center justify-center hover:bg-[#252545] hover:border-yellow-500/60 active:scale-95 transition-all duration-200"
              data-action="trophy"
              onClick={handleTrophyClick}
            >
              <Trophy size={16} className="text-yellow-400" />
            </button>
            
            {/* Follow button */}
            <button 
              className="absolute left-0 top-1/2 transform -translate-y-1/2 w-[34px] h-[34px] rounded-full bg-[#20203A] border border-green-500/30 flex items-center justify-center hover:bg-[#252545] hover:border-green-500/60 active:scale-95 transition-all duration-200"
              data-action="follow"
              onClick={handleFollowClick}
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
