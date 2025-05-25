 import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad, Medal, Zap, Rocket, Trophy, Heart, Star, Users, MessageSquare, Eye, Award, ChevronLeft, ChevronRight, ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import '../../styles/gaming/profile-gaming.css';

// Define achievement interface for type safety
type Achievement = {
  id: string;
  name: string;
  type?: 'trophy' | 'follower' | 'streaming' | 'engagement' | 'sharing' | 'collab' | 'special' | 'general';
  description: string;
  date?: string;
  progress?: number;
  isNew?: boolean;
  reward?: string;
  video_id?: string; // Added video_id to link achievements with video clips for trophy ranking
  points?: number; // Optional points for achievement completion
  tokens?: number; // Optional tokens awarded for achievement
};

// Define comment interface
interface Comment {
  id: string;
  content: string;
  created_at: string;
  user: {
    id?: string;
    name: string;
    avatar: string;
  };
  likes: number;
}

interface GamingProfileProps {
  profile: any;
  tokenBalance: number;
  achievements: Achievement[];
  userPosts: any[];
  savedItems: any[];
  followersCount: number;
  followingCount: number;
  isOwnProfile: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
  boostActive?: boolean;
}

// Define sample achievement data based on the provided list
const sampleAchievements: Achievement[] = [
  // 🏆 Trophy & Weekly Top 10
  {
    id: 'first-taste-gold',
    name: 'First Taste of Gold',
    description: 'Earn 10 trophies on a post.',
    points: 50,
    tokens: 25,
    type: 'trophy',
    progress: 70,
    reward: '25 Tokens + Gold Trophy Badge'
  },
  {
    id: 'viral-sensation',
    name: 'Viral Sensation',
    description: 'Get 100 trophies on a single post.',
    points: 200,
    tokens: 100,
    type: 'trophy',
    progress: 32,
    reward: '100 Tokens + Viral Badge'
  },
  {
    id: 'breaking-in',
    name: 'Breaking In',
    description: 'Rank in the Top 10 of the weekly leaderboard once.',
    points: 150,
    tokens: 75,
    type: 'trophy',
    progress: 100,
    date: '2025-04-28',
    reward: '75 Tokens + Top 10 Badge',
    isNew: true,
    video_id: 'clip1', // Adding video ID to link with the trophy ranking system
  },
  {
    id: 'top-100',
    name: 'Top 100 Streamer',
    type: 'trophy',
    description: 'Reached the Top 100 streamers on the platform',
    date: '2025-04-15',
    progress: 100,
    reward: 'Golden Trophy Badge + 120 Tokens',
    video_id: 'clip2', // Video ID for trophy ranking
    points: 500,
    tokens: 120,
  },
  {
    id: 'hot-streak',
    name: 'Hot Streak',
    description: 'Stay in the Top 10 for 5 weeks in a row.',
    points: 500,
    tokens: 250,
    type: 'trophy',
    progress: 40,
    reward: '250 Tokens + Streak Badge'
  },
  
  // Follower Growth
  {
    id: 'rising-star',
    name: 'Rising Star',
    description: 'Reach 1,000 followers.',
    points: 100,
    tokens: 50,
    type: 'follower',
    progress: 65,
    reward: '50 Tokens + Rising Star Badge'
  },
  {
    id: 'influencer-status',
    name: 'Influencer Status',
    description: 'Gain 10,000 followers.',
    points: 500,
    tokens: 250,
    type: 'follower',
    progress: 20,
    reward: '250 Tokens + Influencer Badge'
  },
  
  // 🎥 Streaming Subscriber Milestones
  {
    id: 'first-supporter',
    name: 'First Supporter',
    description: 'Get your first streaming sub.',
    points: 50,
    tokens: 25,
    type: 'streaming',
    progress: 100,
    date: '2025-03-15',
    reward: '25 Tokens + Supporter Badge'
  },
  {
    id: 'streaming-star',
    name: 'Streaming Star',
    description: 'Reach 100 streaming subscribers.',
    points: 300,
    tokens: 150,
    type: 'streaming',
    progress: 35,
    reward: '150 Tokens + Streaming Star Banner'
  },
  
  // 🤝 Engagement Boosters
  {
    id: 'hype-squad',
    name: 'Hype Squad',
    description: 'Leave 50 comments on others\'s posts.',
    points: 75,
    tokens: 40,
    type: 'engagement',
    progress: 100,
    date: '2025-04-02',
    reward: '40 Tokens + Hype Badge'
  },
  {
    id: 'super-supporter',
    name: 'Super Supporter',
    description: 'Give out 100 trophies.',
    points: 125,
    tokens: 60,
    type: 'engagement',
    progress: 45,
    reward: '60 Tokens + Super Support Badge'
  },
  {
    id: 'conversation-starter',
    name: 'Conversation Starter',
    description: 'Receive 100 replies to your comments.',
    points: 100,
    tokens: 50,
    type: 'engagement',
    progress: 68,
    reward: '50 Tokens + Conversation Badge'
  },
  {
    id: 'community-builder',
    name: 'Community Builder',
    description: 'Start a post that gets 500+ comments.',
    points: 250,
    tokens: 125,
    type: 'engagement',
    progress: 12,
    reward: '125 Tokens + Community Builder Title'
  },
  
  // 📢 Sharing & Promotion
  {
    id: 'signal-booster',
    name: 'Signal Booster',
    description: 'Share 10 other creators\' posts.',
    points: 50,
    tokens: 25,
    type: 'sharing',
    progress: 100,
    date: '2025-04-12',
    reward: '25 Tokens + Signal Badge'
  },
  {
    id: 'clipt-evangelist',
    name: 'Clipt Evangelist',
    description: 'Invite 5 friends to join Clipt.',
    points: 150,
    tokens: 75,
    type: 'sharing',
    progress: 80,
    reward: '75 Tokens + Evangelist Title'
  },
  
  // 🎮 Collab & Creator Support
  {
    id: 'duo-dynamic',
    name: 'Duo Dynamic',
    description: 'Collab on a post that earns 50 trophies.',
    points: 150,
    tokens: 75,
    type: 'collab',
    progress: 0,
    reward: '75 Tokens + Duo Badge'
  },
  {
    id: 'mentor-mode',
    name: 'Mentor Mode',
    description: 'Help a small creator reach 1,000 followers.',
    points: 250,
    tokens: 125,
    type: 'collab',
    progress: 0,
    reward: '125 Tokens + Mentor Crown'
  },
  
  // 🎉 Special & Hidden
  {
    id: 'og-clipt-creator',
    name: 'OG Clipt Creator',
    description: 'Joined within 3 months of launch.',
    points: 100,
    tokens: 50,
    type: 'special',
    progress: 100,
    date: '2025-01-10',
    reward: '50 Tokens + OG Badge'
  },
  {
    id: 'day-one-grinder',
    name: 'Day One Grinder',
    description: 'Posted on Clipt\'s launch day.',
    points: 200,
    tokens: 100,
    type: 'special',
    progress: 100,
    date: '2025-01-01',
    reward: '100 Tokens + Day One Title'
  },
  {
    id: 'mystery-viral',
    name: 'Mystery Viral',
    description: 'An old post goes viral after 30 days.',
    points: 150,
    tokens: 75,
    type: 'special',
    progress: 0,
    reward: '75 Tokens + Mystery Badge'
  },
  {
    id: 'shadow-supporter',
    name: 'Shadow Supporter',
    description: 'Consistently like/comment on someone\'s posts for a month.',
    points: 100,
    tokens: 50,
    type: 'special',
    progress: 75,
    reward: '50 Tokens + Shadow Badge'
  }
];

const GamingProfile: React.FC<GamingProfileProps> = ({
  profile,
  tokenBalance,
  achievements = sampleAchievements, // Use sample achievements if none provided
  userPosts,
  savedItems,
  followersCount,
  followingCount,
  isOwnProfile,
  activeTab,
  onTabChange,
  boostActive = false
}) => {
  const navigate = useNavigate();
  
  // State for selected post and post navigation
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [currentPostIndex, setCurrentPostIndex] = useState<number | null>(null);
  
  // State for post interactions
  const [userLiked, setUserLiked] = useState<Record<string, boolean>>({});
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [userGaveTrophy, setUserGaveTrophy] = useState<Record<string, boolean>>({});
  const [trophyCount, setTrophyCount] = useState<Record<string, number>>({});
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right'>('left');
  
  // State for comments
  const [showComments, setShowComments] = useState<boolean>(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState<string>('');
  const [isSubmittingComment, setIsSubmittingComment] = useState<boolean>(false);
  
  // Comment interaction states
  const [replyingToComment, setReplyingToComment] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [likedComments, setLikedComments] = useState<Record<string, boolean>>({});
  const [commentLikesCount, setCommentLikesCount] = useState<Record<string, number>>({});
  
  // For cool animated star background
  const [stars, setStars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Refs
  const postContainerRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);
  
  // Go to profile settings
  const goToSettings = () => {
    navigate('/settings/profile');
  };
  
  // Initialize post interaction data
  useEffect(() => {
    if (!userPosts || userPosts.length === 0) return;
    
    // Initialize like states for posts
    const initialLikes: Record<string, number> = {};
    const initialUserLiked: Record<string, boolean> = {};
    const initialTrophies: Record<string, number> = {};
    const initialUserGaveTrophy: Record<string, boolean> = {};
    
    userPosts.forEach(post => {
      initialLikes[post.id] = post.likes_count || 0;
      initialUserLiked[post.id] = false;
      initialTrophies[post.id] = post.trophy_count || 0;
      initialUserGaveTrophy[post.id] = false;
    });
    
    setLikes(initialLikes);
    setUserLiked(initialUserLiked);
    setTrophyCount(initialTrophies);
    setUserGaveTrophy(initialUserGaveTrophy);
  }, [userPosts]);
  
  // Initialize keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedPost) {
        if (e.key === 'ArrowRight') {
          showNextPost();
        } else if (e.key === 'ArrowLeft') {
          showPreviousPost();
        } else if (e.key === 'Escape') {
          setSelectedPost(null);
          setShowComments(false);
          document.body.classList.remove('overflow-hidden');
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPost, currentPostIndex]);

  // Additional state for viewing posts
  const [viewingPost, setViewingPost] = useState(false);
  
  // Initialize comment likes whenever comments change
  useEffect(() => {
    if (comments && comments.length > 0) {
      const initialLikes: Record<string, number> = {};
      comments.forEach(comment => {
        initialLikes[comment.id] = comment.likes || 0;
        if (comment.replies && comment.replies.length > 0) {
          comment.replies.forEach(reply => {
            initialLikes[reply.id] = reply.likes || 0;
          });
        }
      });
      setCommentLikesCount(initialLikes);
    }
  }, [comments]);
  
  // Handle liking a comment
  const handleLikeComment = (commentId: string) => {
    setLikedComments(prev => {
      const newState = { ...prev };
      newState[commentId] = !newState[commentId];
      return newState;
    });
    
    setCommentLikesCount(prev => {
      const newState = { ...prev };
      const currentLikes = newState[commentId] || 0;
      newState[commentId] = likedComments[commentId] ? currentLikes - 1 : currentLikes + 1;
      return newState;
    });
    
    // Here you would typically call an API to update the like on the server
    toast.success(likedComments[commentId] ? 'Comment unliked' : 'Comment liked', {
      position: 'bottom-center',
      className: 'cosmic-toast'
    });
  };
  
  // Go to user profile when clicking on avatar or username
  const goToUserProfile = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  // Handle adding a reply to a comment
  const handleAddReply = (commentId: string) => {
    if (!replyContent.trim()) return;
    
    const newReply = {
      id: `reply-${Date.now()}`,
      content: replyContent,
      created_at: new Date().toISOString(),
      user: {
        id: profile?.id || 'current-user',
        name: profile?.username || 'You',
        avatar: profile?.avatar_url || `https://api.dicebear.com/6.x/bottts/svg?seed=${profile?.username || 'You'}`
      },
      likes: 0
    };
    
    // Find the comment to add the reply to
    setComments(prevComments => {
      return prevComments.map(comment => {
        if (comment.id === commentId) {
          // Create replies array if it doesn't exist
          const replies = comment.replies ? [...comment.replies, newReply] : [newReply];
          return { ...comment, replies };
        }
        return comment;
      });
    });
    
    // Reset reply state
    setReplyContent('');
    setReplyingToComment(null);
    
    toast.success('Reply added!', {
      position: 'bottom-center',
      className: 'cosmic-toast'
    });
  };

  // Handle post click to show full-screen view
  const handlePostClick = (post: any, index: number) => {
    setSelectedPost(post);
    setCurrentPostIndex(index);
    document.body.classList.add('overflow-hidden');
    
    // Immediately load comments for the post
    if (post) {
      // Clear any existing comments first
      setComments([]);
      
      // Generate random comments for demo purposes
      const dummyUsers = [
        { name: 'CosmicGamer', avatar: 'https://placehold.co/100/252944/FFFFFF?text=C' },
        { name: 'StarDust42', avatar: 'https://placehold.co/100/252944/FFFFFF?text=S' },
        { name: 'NebulaNinja', avatar: 'https://placehold.co/100/252944/FFFFFF?text=N' },
        { name: 'GalaxyQuest', avatar: 'https://placehold.co/100/252944/FFFFFF?text=G' },
        { name: 'VoidWalker', avatar: 'https://placehold.co/100/252944/FFFFFF?text=V' }
      ];
      
      const commentTexts = [
        "Amazing gameplay! What settings are you using?",
        "That was an incredible move at 0:42!",
        "How did you pull off that combo?",
        "The graphics in this game are next level.",
        "You're definitely in the top players for this game!",
        "I need to learn that technique, any tips?",
        "What's your streaming schedule?",
        "This deserves more trophies for sure."
      ];
      
      // Generate 3-6 random comments for a better experience
      const randomCommentCount = Math.floor(Math.random() * 4) + 3;
      const generatedComments = [];
      
      for (let i = 0; i < randomCommentCount; i++) {
        const randomUser = dummyUsers[Math.floor(Math.random() * dummyUsers.length)];
        const randomText = commentTexts[Math.floor(Math.random() * commentTexts.length)];
        
        generatedComments.push({
          id: `comment-${Date.now()}-${i}`,
          content: randomText,
          created_at: new Date(Date.now() - Math.random() * 86400000).toISOString(), // Random time in last 24h
          user: randomUser,
          likes: Math.floor(Math.random() * 10)
        });
      }
      
      // Sort by most recent
      generatedComments.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      // Add a short delay to simulate loading comments from server
      setTimeout(() => {
        setComments(generatedComments);
      }, 300);
    }
  };

  // Show next post in full-screen view
  const showNextPost = () => {
    if (currentPostIndex < userPosts.length - 1) {
      setSwipeDirection('left');
      setCurrentPostIndex(currentPostIndex + 1);
      setSelectedPost(userPosts[currentPostIndex + 1]);
    }
  };
  
  // Show previous post in full-screen view

  // Show previous post in full-screen view
  const showPreviousPost = () => {
    if (currentPostIndex !== null && currentPostIndex > 0) {
      setCurrentPostIndex(currentPostIndex - 1);
      setSelectedPost(userPosts[currentPostIndex - 1]);
    }
  };
  
  // Handle double-click to like a post
  const handleDoubleClick = (postId: string) => {
    // Only like if not already liked
    if (!userLiked[postId]) {
      handleLikePost(postId);
      
      // Show animation effect on double-click
      const updatedLiked = { ...userLiked };
      updatedLiked[postId] = true;
      setUserLiked(updatedLiked);
      
      setTimeout(() => {
        if (commentInputRef.current) {
          commentInputRef.current.focus();
        }
      }, 300);
    }
  };
  
  // Handle liking a post
  const handleLikePost = (postId: string) => {
    // Toggle like status
    const isLiked = userLiked[postId];
    
    if (isLiked) {
      // Unlike the post
      setLikes(prev => ({
        ...prev,
        [postId]: Math.max(0, (prev[postId] || 1) - 1)
      }));
      
      setUserLiked(prev => ({
        ...prev,
        [postId]: false
      }));
      
      toast.error('Post unliked', {
        icon: <Heart className="w-4 h-4 text-gray-500" />
      });
    } else {
      // Like the post
      setLikes(prev => ({
        ...prev,
        [postId]: (prev[postId] || 0) + 1
      }));
      
      setUserLiked(prev => ({
        ...prev,
        [postId]: true
      }));
      
      toast.success('Cosmic clip liked!', {
        position: 'bottom-center',
        className: 'cosmic-toast',
        duration: 1500,
        icon: <Heart className="w-4 h-4 text-red-500" />
      });
    }
    
    // In a production app, we would update the database
    // supabase.from('likes').upsert({ post_id: postId, user_id: profile.id, liked: !isLiked })
  };

  // Handle giving a trophy to a post (for ranking)
  const handleGiveTrophy = (postId: string) => {
    if (userGaveTrophy[postId]) {
      toast.error('You already ranked this post', {
        position: 'bottom-center',
        className: 'cosmic-toast',
        duration: 1500
      });
      return;
    }
    
    // Update trophy count
    setTrophyCount(prev => ({
      ...prev,
      [postId]: (prev[postId] || 0) + 1
    }));
    
    // Update user gave trophy status
    setUserGaveTrophy(prev => ({
      ...prev,
      [postId]: true
    }));
    
    // In a production app, we would update the database here
    // supabase.from('trophies').insert({ post_id: postId, user_id: profile.id })
    
    toast.success('Trophy given! This post will rank higher', {
      position: 'bottom-center',
      className: 'cosmic-toast',
      duration: 1500,
      icon: <Trophy className="w-4 h-4 text-yellow-500" />
    });
  };

  // Handle posting a new comment
  const handleAddComment = (postId: string) => {
    if (!newComment.trim()) return;
    
    setIsSubmittingComment(true);
    
    try {
      // Generate a unique ID for the comment
      const commentId = `comment-${Date.now()}`;
      
      // Create a new comment object
      const newCommentObj = {
        id: commentId,
        content: newComment,
        created_at: new Date().toISOString(),
        user: {
          id: profile?.id || 'current-user',
          name: profile?.display_name || profile?.username || 'Current User',
          avatar: profile?.avatar_url || `https://placehold.co/100/252944/FFFFFF?text=${profile?.username?.charAt(0) || 'U'}`
        },
        likes: 0
      };
      
      // Add comment to the list
      setComments(prev => [newCommentObj, ...prev]);
      
      // Clear the input field
      setNewComment('');
      
      // In a production app, we would save to the database
      // supabase.from('comments').insert({
      //   post_id: postId,
      //   user_id: profile.id,
      //   content: newComment
      // })
      
      toast.success('Comment added to cosmic post!', {
        position: 'bottom-center',
        className: 'cosmic-toast',
        duration: 1500,
        icon: <MessageSquare className="w-4 h-4 text-blue-400" />
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment. Please try again.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Toggle comments visibility
  const toggleComments = (postId: string, toggle = true) => {
    // If we're toggling, flip the current state, otherwise just load comments
    if (toggle) {
      setShowComments(!showComments);
    } else {
      setShowComments(true);
    }
    
    // If we're showing comments and there are none yet, fetch them
    if (showComments === false || !toggle) {
      // In a production app, we would fetch from database
      // supabase.from('comments').select('*').eq('post_id', postId).order('created_at', { ascending: false })
      
      // Simulate loading comments with a small delay
      setTimeout(() => {
        // Generate random comments for demo purposes
        const dummyUsers = [
          { name: 'CosmicGamer', avatar: 'https://placehold.co/100/252944/FFFFFF?text=C' },
          { name: 'StarDust42', avatar: 'https://placehold.co/100/252944/FFFFFF?text=S' },
          { name: 'NebulaNinja', avatar: 'https://placehold.co/100/252944/FFFFFF?text=N' },
          { name: 'GalaxyQuest', avatar: 'https://placehold.co/100/252944/FFFFFF?text=G' },
          { name: 'VoidWalker', avatar: 'https://placehold.co/100/252944/FFFFFF?text=V' }
        ];
        
        const commentTexts = [
          "Amazing gameplay! What settings are you using?",
          "That was an incredible move at 0:42!",
          "How did you pull off that combo?",
          "The graphics in this game are next level.",
          "You're definitely in the top players for this game!",
          "I need to learn that technique, any tips?",
          "What's your streaming schedule?",
          "This deserves more trophies for sure."
        ];
        
        // Generate 0-5 random comments
        const randomCommentCount = Math.floor(Math.random() * 6);
        const generatedComments = [];
        
        for (let i = 0; i < randomCommentCount; i++) {
          const randomUser = dummyUsers[Math.floor(Math.random() * dummyUsers.length)];
          const randomText = commentTexts[Math.floor(Math.random() * commentTexts.length)];
          
          generatedComments.push({
            id: `comment-${Date.now()}-${i}`,
            content: randomText,
            created_at: new Date(Date.now() - Math.random() * 86400000).toISOString(), // Random time in last 24h
            user: randomUser,
            likes: Math.floor(Math.random() * 10)
          });
        }
        
        // Sort by most recent
        generatedComments.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        setComments(generatedComments);
      }, 300);
      
      // If no comments loaded yet, add some sample ones
      if (comments.length === 0) {
        const sampleComments = [
          {
            id: 'comment-1',
            user: {
              id: 'user-1',
              name: 'Cosmic Gamer',
              avatar: 'https://placehold.co/100x100/252944/FFFFFF?text=CG'
            },
            content: 'This is amazing content! Love the gaming clips!',
            created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            likes: 12
          },
          {
            id: 'comment-2',
            user: {
              id: 'user-2',
              name: 'Pro Streamer',
              avatar: 'https://placehold.co/100x100/252944/FFFFFF?text=PS'
            },
            content: 'Your skills are next level! Would love to collab sometime.',
            created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
            likes: 5
          },
          {
            id: 'comment-3',
            user: {
              id: 'user-3',
              name: 'Gaming Enthusiast',
              avatar: 'https://placehold.co/100x100/252944/FFFFFF?text=GE'
            },
            content: 'The cosmic theme of your profile is out of this world! 🌌',
            created_at: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
            likes: 8
          }
        ];
        
        setComments(sampleComments);
      }
    }
    
    // Focus on comment input when showing comments
    if (!showComments && toggle) {
      setTimeout(() => {
        if (commentInputRef.current) {
          commentInputRef.current.focus();
        }
      }, 300);
    }
  };

  // Swipe direction already defined above
  
  // Handle keyboard navigation for posts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedPost) return;
      
      switch (e.key) {
        case 'ArrowRight':
          showNextPost();
          break;
        case 'ArrowLeft':
          showPreviousPost();
          break;
        case 'Escape':
          setSelectedPost(null);
          document.body.classList.remove('overflow-hidden');
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      // Make sure to remove the overflow-hidden class when unmounting
      document.body.classList.remove('overflow-hidden');
    };
  }, [selectedPost, currentPostIndex, userPosts]);
  
  // Generate random stars for background
  const generateStars = (count: number) => {
    return Array.from({ length: count }).map((_, index) => {
      const size = Math.random() * 3 + 1;
      const top = Math.random() * 100;
      const left = Math.random() * 100;
      const delay = Math.random() * 5;
      const duration = Math.random() * 3 + 2;
      
      return (
        <div
          key={index}
          className="cosmic-star"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            top: `${top}%`,
            left: `${left}%`,
            animationDelay: `${delay}s`,
            '--twinkle-duration': `${duration}s`
          } as React.CSSProperties}
        />
      );
    });
  };

  return (
    <div className="gaming-profile-container">
      {/* Cosmic stars background */}
      <div className="stars-container">
        {generateStars(150)}
      </div>
      
      {/* Main profile content */}
      <div className="gaming-profile-frame mx-auto max-w-lg px-4 py-6 mt-4">
        {/* Boost badge if active */}
        {boostActive && (
          <div className="boost-badge">
            <Zap className="boost-badge-icon" />
            Boosted
          </div>
        )}
        
        {/* Profile avatar */}
        <div className="cosmic-avatar-container flex justify-center mb-6">
          <div className="avatar-glow"></div>
          <div className="relative">
            {/* Orbiting elements */}
            <div className="orbiting-element orbiting-planet-1" style={{ top: '10%', left: '10%' }}></div>
            <div className="orbiting-element orbiting-planet-2" style={{ bottom: '10%', right: '10%' }}></div>
            
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="w-24 h-24 rounded-full overflow-hidden border-2 border-indigo-500/30"
            >
              <img 
                src={profile?.avatar_url || 'https://placehold.co/200x200/252944/FFFFFF?text=User'} 
                alt={profile?.username || 'User'} 
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>
        </div>
        
        {/* Profile name and token display */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-center">
            <h1 className="text-xl font-bold text-white mb-1">
              {profile?.display_name || profile?.username || 'Gamer'}
            </h1>
            <p className="text-sm text-gray-400">@{profile?.username || 'username'}</p>
          </div>
          
          <div className="token-display">
            <span className="token-amount">{tokenBalance}</span>
            <Star className="token-icon w-4 h-4" />
          </div>
        </div>
        
        {/* Stats display */}
        <div className="stats-container">
          <div className="stat-item">
            <span className="stat-value">{userPosts.length}</span>
            <span className="stat-label">Clips</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{followersCount}</span>
            <span className="stat-label">Followers</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{followingCount}</span>
            <span className="stat-label">Following</span>
          </div>
        </div>
        
        {/* Bio section */}
        {profile?.bio && (
          <div className="mt-4 bg-slate-800/30 p-3 rounded-lg border border-indigo-500/20">
            <p className="text-sm text-gray-300">{profile.bio}</p>
          </div>
        )}
        
        {/* Action buttons */}
        <div className="flex gap-3 mt-4">
          {isOwnProfile ? (
            <>
              <Button 
                className="gaming-button glow-effect flex-1"
                onClick={() => navigate('/boost-store')}
              >
                <Zap className="w-4 h-4" />
                Get Boost
              </Button>
              <Button 
                className="gaming-button glow-effect flex-1"
                onClick={() => navigate('/edit-profile')}
              >
                <Gamepad className="w-4 h-4" />
                Edit Profile
              </Button>
            </>
          ) : (
            <>
              <Button 
                className="gaming-button glow-effect flex-1"
                onClick={() => {
                  // Follow user logic
                  toast.success(`Following ${profile?.username || 'user'}`);
                }}
              >
                <Users className="w-4 h-4" />
                Follow
              </Button>
              <Button 
                className="gaming-button glow-effect flex-1"
                onClick={() => navigate('/subscription')}
              >
                <Rocket className="w-4 h-4" />
                Subscribe
              </Button>
            </>
          )}
        </div>
        
        {/* Content tabs */}
        <div className="gaming-tabs mt-6">
          <button 
            className={`gaming-tab ${activeTab === 'clipts' ? 'active' : ''}`}
            onClick={() => onTabChange('clipts')}
          >
            Clips
          </button>
          <button 
            className={`gaming-tab ${activeTab === 'achievements' ? 'active' : ''}`}
            onClick={() => onTabChange('achievements')}
          >
            Achievements
          </button>
          <button 
            className={`gaming-tab ${activeTab === 'saved' ? 'active' : ''}`}
            onClick={() => onTabChange('saved')}
          >
            Saved
          </button>
        </div>
        
        {/* Tab content */}
        <div className="mt-4">
          {activeTab === 'clipts' && (
            <>
              {/* Modal for full-screen viewing */}
              {selectedPost && (
                <div className="fixed inset-0 bg-black/90 z-50 flex flex-col justify-center items-center">
                  {/* Close button */}
                  <button 
                    onClick={() => setSelectedPost(null)} 
                    className="absolute top-4 right-4 text-white hover:text-red-400 z-50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                  
                  {/* Navigation arrows */}
                  <div className="absolute inset-y-0 left-4 flex items-center">
                    <button 
                      onClick={showPreviousPost} 
                      className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
                      disabled={currentPostIndex <= 0}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                      </svg>
                    </button>
                  </div>
                  
                  <div className="absolute inset-y-0 right-4 flex items-center">
                    <button 
                      onClick={showNextPost} 
                      className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
                      disabled={currentPostIndex >= userPosts.length - 1}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </button>
                  </div>
                  
                  {/* Content container */}
                  <div className="max-w-6xl w-full max-h-[85vh] flex flex-col">
                    {/* Post content */}
                    <motion.div 
                      key={selectedPost.id}
                      initial={{ opacity: 0, x: swipeDirection === 'left' ? 50 : -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="w-full"
                    >
                      {/* Video content if available */}
                      {selectedPost.video_url ? (
                        <div className="relative w-full pt-[56.25%] bg-gray-900 rounded-lg overflow-hidden">
                          {/* Trophy rank button overlay */}
                          <div className="absolute top-4 right-4 z-10">
                            <button 
                              className={`flex items-center gap-2 ${userGaveTrophy[selectedPost.id] ? 'bg-yellow-500/80 text-black' : 'bg-black/50 text-white'} hover:bg-yellow-500/70 hover:text-black transition-all duration-300 py-2 px-4 rounded-full backdrop-blur-sm border ${userGaveTrophy[selectedPost.id] ? 'border-yellow-400' : 'border-white/30'}`}
                              onClick={() => handleGiveTrophy(selectedPost.id)}
                            >
                              <Trophy className="h-5 w-5" />
                              <span className="font-medium text-sm">{userGaveTrophy[selectedPost.id] ? 'Ranked!' : 'Rank Clip'}</span>
                              <span className="bg-black/40 text-white text-xs px-2 py-0.5 rounded-full">{trophyCount[selectedPost.id] || 0}</span>
                            </button>
                          </div>
                          <video 
                            className="absolute inset-0 w-full h-full object-contain" 
                            src={selectedPost.video_url} 
                            controls 
                            autoPlay
                          />
                        </div>
                      ) : (
                        <img 
                          src={selectedPost.image_url || 'https://placehold.co/1200x800/252944/FFFFFF?text=Gaming+Highlight'} 
                          alt={selectedPost.title}
                          className="w-full max-h-[70vh] object-contain rounded-lg" 
                        />
                      )}
                      
                      {/* Post details */}
                      <div className="mt-4 text-white px-2">
                        <h2 className="text-xl font-bold">{selectedPost.title}</h2>
                        <p className="text-gray-300 mt-2">{selectedPost.content}</p>
                        
                        <div className="flex justify-between items-center mt-4">
                          <div className="flex items-center space-x-4">
                            <div 
                              className="flex items-center cursor-pointer hover:text-red-400 transition-colors duration-200" 
                              onClick={() => handleLikePost(selectedPost.id)}
                            >
                              <Heart className={`h-5 w-5 ${userLiked[selectedPost.id] ? 'text-red-500' : 'text-gray-400'} mr-1`} />
                              <span>{selectedPost.likes_count || likes[selectedPost.id] || 0}</span>
                            </div>
                            <div 
                              className="flex items-center cursor-pointer hover:text-blue-400 transition-colors duration-200" 
                              onClick={() => toggleComments(selectedPost.id)}
                            >
                              <MessageSquare className="h-5 w-5 text-blue-500 mr-1" />
                              <span>{selectedPost.comments_count || 0}</span>
                            </div>
                            <div className="flex items-center">
                              <Eye className="h-5 w-5 text-green-500 mr-1" />
                              <span>{selectedPost.views_count || 0}</span>
                            </div>
                            {selectedPost.type === 'video' && (
                              <div 
                                className="flex items-center cursor-pointer hover:text-yellow-400 transition-colors duration-200" 
                                onClick={() => handleGiveTrophy(selectedPost.id)}
                              >
                                <Trophy className={`h-5 w-5 ${userGaveTrophy[selectedPost.id] ? 'text-yellow-500' : 'text-white'} mr-1`} />
                                <span>{trophyCount[selectedPost.id] || 0}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="text-sm text-gray-400">
                            Posted {new Date(selectedPost.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                    
                    {/* Comments section - always visible */}
                    <div className="mt-6 bg-gray-900/50 rounded-lg p-4 border border-indigo-500/20">
                      <div className="flex items-center mb-4">
                        <MessageSquare className="h-5 w-5 text-blue-400 mr-2" />
                        <h3 className="text-lg font-medium text-white">Comments</h3>
                        <div className="ml-2 px-2 py-0.5 bg-indigo-900/50 rounded-full text-xs text-blue-300">
                          {comments.length}
                        </div>
                      </div>
                      
                      {/* Add new comment */}
                      <div className="flex gap-3 mb-5">
                        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                          <img 
                            src={profile?.avatar_url || `https://placehold.co/100/252944/FFFFFF?text=${profile?.username?.charAt(0) || 'U'}`} 
                            alt="Your avatar" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 flex gap-2">
                          <input
                            type="text"
                            ref={commentInputRef}
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a cosmic comment..."
                            className="flex-1 bg-black/30 border border-indigo-500/30 rounded-full px-4 py-2 text-white text-sm focus:outline-none focus:border-indigo-500/60"
                            onKeyDown={(e) => e.key === 'Enter' && handleAddComment(selectedPost.id)}
                          />
                          <button
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => handleAddComment(selectedPost.id)}
                            disabled={isSubmittingComment || !newComment.trim()}
                          >
                            {isSubmittingComment ? (
                              <span className="animate-pulse">Posting...</span>
                            ) : (
                              <>
                                <span>Post</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="m22 2-7 20-4-9-9-4Z" />
                                  <path d="M22 2 11 13" />
                                </svg>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                      
                      {/* Comments section */}
                      
                      {/* Comments list */}
                      <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {comments.length > 0 ? (
                          comments.map(comment => {
                            // Get comment state from the state objects
                            const commentId = comment.id;
                            const isReplying = replyingToComment === commentId;
                            const userLikedComment = likedComments[commentId] || false;
                            const commentLikes = commentLikesCount[commentId] || comment.likes || 0;
                            
                            // Handle like comment
                            const handleLikeComment = () => {
                              if (userLikedComment) {
                                // Unlike comment
                                setCommentLikesCount(prev => ({
                                  ...prev,
                                  [commentId]: Math.max(0, (prev[commentId] || 0) - 1)
                                }));
                                setLikedComments(prev => ({
                                  ...prev,
                                  [commentId]: false
                                }));
                              } else {
                                // Like comment
                                setCommentLikesCount(prev => ({
                                  ...prev,
                                  [commentId]: (prev[commentId] || 0) + 1
                                }));
                                setLikedComments(prev => ({
                                  ...prev,
                                  [commentId]: true
                                }));
                                
                                toast.success('Comment liked!', {
                                  position: 'bottom-center',
                                  className: 'cosmic-toast',
                                  duration: 1000,
                                  icon: <Heart className="w-4 h-4 text-red-500" />
                                });
                              }
                            };
                            
                            // Handle posting a reply
                            const handlePostReply = () => {
                              if (!replyContent.trim()) return;
                              
                              // Create a new reply
                              const newReply = {
                                id: `reply-${Date.now()}`,
                                content: replyContent,
                                created_at: new Date().toISOString(),
                                user: {
                                  id: profile?.id || 'current-user',
                                  name: profile?.display_name || profile?.username || 'Current User',
                                  avatar: profile?.avatar_url || `https://placehold.co/100/252944/FFFFFF?text=${profile?.username?.charAt(0) || 'U'}`
                                },
                                likes: 0,
                                parentId: commentId
                              };
                              
                              // Add reply to comments list
                              setComments(prev => [newReply, ...prev]);
                              
                              // Reset reply state
                              setReplyingToComment(null);
                              setReplyContent('');
                              
                              // Initialize like count for the new reply
                              setCommentLikesCount(prev => ({
                                ...prev,
                                [newReply.id]: 0
                              }));
                              
                              toast.success('Reply posted!', {
                                position: 'bottom-center',
                                className: 'cosmic-toast',
                                duration: 1000,
                                icon: <MessageSquare className="w-4 h-4 text-blue-400" />
                              });
                            };
                            
                            // Navigate to user profile
                            const goToUserProfile = (username: string) => {
                              // Close the current modal
                              setSelectedPost(null);
                              document.body.classList.remove('overflow-hidden');
                              
                              // Navigate to the user profile
                              navigate(`/profile/${username}`);
                            };
                            
                            return (
                              <div key={comment.id} className="flex gap-3 group animate-fadeIn">
                                <div 
                                  className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all" 
                                  onClick={() => goToUserProfile(comment.user.name)}
                                >
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <div 
                                      className="text-indigo-300 font-medium hover:text-blue-400 cursor-pointer transition-colors"
                                      onClick={() => navigate(`/profile/${comment.user.id}`)}
                                    >
                                      {comment.user.name}
                                    </div>
                                    <span className="text-xs text-gray-500">
                                      {new Date(comment.created_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="text-gray-300 text-sm mt-1">{comment.content}</p>
                                  
                                  {/* Comment actions */}
                                  <div className="flex items-center gap-4 mt-2">
                                    <button 
                                      className={`flex items-center gap-1 text-xs ${likedComments[comment.id] ? 'text-pink-500' : 'text-gray-500 hover:text-pink-400'} transition-colors`}
                                      onClick={() => handleLikeComment(comment.id)}
                                    >
                                      <Heart className="h-3 w-3" fill={likedComments[comment.id] ? "currentColor" : "none"} />
                                      <span>{commentLikesCount[comment.id] || 0}</span>
                                    </button>
                                    
                                    <button 
                                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-400 transition-colors"
                                      onClick={() => setReplyingToComment(replyingToComment === comment.id ? null : comment.id)}
                                    >
                                      <MessageSquare className="h-3 w-3" />
                                      <span>Reply</span>
                                    </button>
                                  </div>
                                  
                                  {/* Reply input */}
                                  {replyingToComment === comment.id && (
                                    <div className="mt-3">
                                      <div className="flex items-center gap-2">
                                        <input 
                                          type="text" 
                                          value={replyContent}
                                          onChange={(e) => setReplyContent(e.target.value)}
                                          placeholder="Write a reply..."
                                          className="flex-1 bg-indigo-900/30 border border-indigo-600/30 rounded-full px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                        <button 
                                          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-1.5 transition-colors"
                                          onClick={() => handleAddReply(comment.id)}
                                          disabled={!replyContent.trim()}
                                        >
                                          <Rocket className="h-4 w-4" />
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Replies */}
                                  {comment.replies && comment.replies.length > 0 && (
                                    <div className="mt-3 pl-4 border-l border-indigo-500/20 space-y-3">
                                      {comment.replies.map((reply) => (
                                        <div key={reply.id} className="bg-indigo-950/50 p-2 rounded-md">
                                          <div className="flex items-start gap-2">
                                            <img 
                                              src={reply.user.avatar || `https://api.dicebear.com/6.x/bottts/svg?seed=${reply.user.name}`} 
                                              alt={reply.user.name} 
                                              className="w-6 h-6 rounded-full cursor-pointer hover:ring-1 hover:ring-blue-400 transition-all"
                                              onClick={() => navigate(`/profile/${reply.user.id}`)}
                                            />
                                            <div className="flex-1">
                                              <div className="flex items-center justify-between">
                                                <div 
                                                  className="text-indigo-300 text-xs font-medium hover:text-blue-400 cursor-pointer transition-colors"
                                                  onClick={() => navigate(`/profile/${reply.user.id}`)}
                                                >
                                                  {reply.user.name}
                                                </div>
                                                <span className="text-[10px] text-gray-500">
                                                  {new Date(reply.created_at).toLocaleDateString()}
                                                </span>
                                              </div>
                                              <p className="text-gray-300 text-xs mt-0.5">{reply.content}</p>
                                              
                                              {/* Reply actions */}
                                              <div className="flex items-center gap-3 mt-1">
                                                <button 
                                                  className={`flex items-center gap-1 text-[10px] ${likedComments[reply.id] ? 'text-pink-500' : 'text-gray-500 hover:text-pink-400'} transition-colors`}
                                                  onClick={() => handleLikeComment(reply.id)}
                                                >
                                                  <Heart className="h-2.5 w-2.5" fill={likedComments[reply.id] ? "currentColor" : "none"} />
                                                  <span>{commentLikesCount[reply.id] || 0}</span>
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6 text-gray-500">
                            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
                            <p>No comments yet. Be the first to comment!</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Swipe instructions */}
                    <div className="text-center text-gray-500 text-sm mt-4">
                      Swipe or use arrow keys to navigate between posts
                    </div>
                  </div>
                </div>
              )}
              
              {/* Clips grid */}
              <div className="game-clips-grid">
                {userPosts.length > 0 ? (
                  userPosts.map((post, index) => (
                    <motion.div 
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="clip-item"
                      onClick={() => handlePostClick(post, index)}
                    >
                      {/* Video indicator if available */}
                      {post.video_url && (
                        <div className="video-indicator">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="none">
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                          </svg>
                        </div>
                      )}
                      
                      <img 
                        src={post.image_url || 'https://placehold.co/300x200/252944/FFFFFF?text=Gaming+Clip'} 
                        alt={post.title} 
                        className="clip-thumbnail"
                      />
                      <div className="clip-overlay">
                        <div className="clip-title">{post.title}</div>
                        <div className="clip-stats">
                          <span className="flex items-center">
                            <Eye className="inline w-3 h-3 mr-1 text-green-400" /> {post.views_count || 0}
                          </span>
                          <span 
                            className={`flex items-center ${userLiked[post.id] ? 'text-red-400' : 'text-white'} cursor-pointer hover:text-red-300 transition-colors duration-200`}
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent opening the post
                              handleLikePost(post.id);
                            }}
                          >
                            <Heart className="inline w-3 h-3 mr-1" /> {likes[post.id] || post.likes_count || 0}
                          </span>
                          <span 
                            className="flex items-center text-blue-400 cursor-pointer hover:text-blue-300 transition-colors duration-200"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent opening the post
                              handlePostClick(post, index);
                              setTimeout(() => toggleComments(post.id), 300);
                            }}
                          >
                            <MessageSquare className="inline w-3 h-3 mr-1" /> {post.comments_count || 0}
                          </span>
                          {post.video_url && (
                            <span 
                              className={`trophy-stat flex items-center ${userGaveTrophy[post.id] ? 'text-yellow-400' : 'text-white'} cursor-pointer hover:text-yellow-300 transition-colors duration-200`}
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent opening the post
                                handleGiveTrophy(post.id);
                              }}
                            >
                              <Trophy className="inline w-3 h-3 mr-1" /> {trophyCount[post.id] || 0}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))                  
                ) : (
                  <div className="text-center py-6 text-gray-400 col-span-full">
                    No clips found
                  </div>
                )}
              </div>
            </>
          )}
          
          {activeTab === 'achievements' && (
            <div className="achievements-section">
              <div className="achievements-header flex justify-between items-center mb-3">
                <h3 className="text-xl font-bold text-indigo-300">Player Achievements</h3>
                <div className="achievements-stats">
                  <span className="text-sm text-indigo-400">{achievements.length} Total</span>
                </div>
              </div>
              
              <div className="achievements-scrollable max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {achievements.length > 0 ? (
                  <div className="achievements-grid">
                    {achievements.map((achievement) => (
                      <motion.div 
                        key={achievement.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="achievement-card bg-gradient-to-br from-[#1A1A3A]/80 to-[#282860]/80 p-4 rounded-lg mb-3 border border-indigo-500/30 hover:border-indigo-400/50 transition-all"
                      >
                        <div className="flex items-start">
                          <div className="achievement-icon-container mr-3 bg-indigo-900/50 p-2 rounded-lg border border-indigo-600/30">
                            {/* Trophy & Weekly Top 10 */}
                            {achievement.type === 'trophy' && <Trophy className="text-yellow-400 h-6 w-6" />}
                            
                            {/* Follower Growth */}
                            {achievement.type === 'follower' && <Users className="text-green-400 h-6 w-6" />}
                            
                            {/* Streaming Milestones */}
                            {achievement.type === 'streaming' && <Rocket className="text-cyan-400 h-6 w-6" />}
                            
                            {/* Engagement */}
                            {achievement.type === 'engagement' && <Zap className="text-blue-400 h-6 w-6" />}
                            
                            {/* Sharing */}
                            {achievement.type === 'sharing' && <Zap className="text-pink-400 h-6 w-6" />}
                            
                            {/* Collab */}
                            {achievement.type === 'collab' && <Gamepad className="text-amber-400 h-6 w-6" />}
                            
                            {/* Special */}
                            {achievement.type === 'special' && <Star className="text-purple-400 h-6 w-6" />}
                            
                            {/* General/Others */}
                            {(!achievement.type || achievement.type === 'general') && <Medal className="text-indigo-400 h-6 w-6" />}
                          </div>
                          
                          <div className="achievement-content flex-1">
                            <div className="achievement-header flex justify-between">
                              <div className="achievement-name text-white font-bold mb-1">{achievement.name}</div>
                              <div className="flex items-center space-x-2">
                                {/* Trophy ranking button for video achievements */}
                                {achievement.type === 'trophy' && achievement.video_id && (
                                  <div className="cosmic-trophy-rank">
                                    <button 
                                      className={`flex items-center ${userGaveTrophy[achievement.video_id] ? 'text-yellow-400' : 'text-white'} hover:text-yellow-300 transition-colors duration-200 px-2 py-0.5 rounded-full bg-indigo-900/50 border border-indigo-500/30`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleGiveTrophy(achievement.video_id || '');
                                        toast.success('Trophy given! Video will rank higher', {
                                          position: 'bottom-center',
                                          className: 'cosmic-toast',
                                          duration: 1500,
                                          icon: <Trophy className="w-4 h-4 text-yellow-500" />
                                        });
                                      }}
                                    >
                                      <Trophy className="inline w-3 h-3 mr-1" />
                                      <span className="text-xs">{trophyCount[achievement.video_id || ''] || 0}</span>
                                    </button>
                                  </div>
                                )}
                                {/* New achievement badge */}
                                {achievement.isNew && (
                                  <span className="text-xs bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-2 py-0.5 rounded-full animate-pulse">NEW</span>
                                )}
                              </div>
                            </div>
                            <div className="achievement-desc text-gray-300 text-sm">{achievement.description}</div>
                            
                            {/* Token rewards displayed prominently */}
                            <div className="achievement-rewards flex items-center mt-1.5">
                              <div className="token-reward flex items-center bg-purple-900/40 text-purple-200 text-xs font-bold py-0.5 px-1.5 rounded-md border border-purple-600/30 mr-2">
                                <Star className="h-3 w-3 text-yellow-300 mr-1" />
                                <span>+{achievement.tokens} Tokens</span>
                              </div>
                              <div className="xp-reward flex items-center bg-indigo-900/40 text-indigo-200 text-xs font-bold py-0.5 px-1.5 rounded-md border border-indigo-600/30">
                                <Zap className="h-3 w-3 text-blue-300 mr-1" />
                                <span>+{achievement.points} XP</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="achievement-points-container flex-shrink-0 ml-2 flex flex-col items-end">
                            {achievement.date && (
                              <div className="achievement-date text-gray-400 text-xs mb-1">
                                {new Date(achievement.date).toLocaleDateString()}
                              </div>
                            )}
                        </div>
                        </div>
                        
                        {/* Progress bar for achievements in progress */}
                        {achievement.progress !== undefined && (
                          <div className={`achievement-progress mt-3 ${achievement.isNew ? 'achievement-new' : ''}`}>
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                              <span>Progress</span>
                              <span className={achievement.progress >= 100 ? 'text-green-400' : 'text-blue-400'}>
                                {achievement.progress}%
                                {achievement.progress >= 100 && ' • Completed'}
                              </span>
                            </div>
                            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${achievement.progress >= 100 ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-blue-500 to-indigo-600'}`}
                                style={{ width: `${Math.min(achievement.progress, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                        
                        {/* Reward details */}
                        {achievement.reward && (
                          <div className="achievement-reward mt-2 text-xs bg-indigo-950/30 p-2 rounded-md border border-indigo-500/20">
                            <div className="flex items-center">
                              <Trophy className="h-3 w-3 text-yellow-400 mr-1.5" />
                              <span className="text-indigo-200 font-medium">Reward:</span>
                            </div>
                            <div className="mt-1 text-gray-300 pl-4.5">{achievement.reward}</div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-indigo-900/20 rounded-lg border border-indigo-500/20">
                    <Trophy className="mx-auto h-12 w-12 text-gray-600 mb-2" />
                    <div className="text-gray-400 mb-1">No achievements unlocked yet</div>
                    <div className="text-gray-500 text-sm">Keep streaming to earn your first achievement!</div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'saved' && (
            <div className="game-clips-grid">
              {savedItems.length > 0 ? (
                savedItems.map((item) => (
                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="clip-item"
                  >
                    <img 
                      src={item.image_url || 'https://placehold.co/300x200/252944/FFFFFF?text=Saved+Item'} 
                      alt={item.title} 
                      className="clip-thumbnail"
                    />
                    <div className="clip-overlay">
                      <div className="clip-title">{item.title}</div>
                      <div className="clip-stats">
                        <span><Heart className="inline w-3 h-3" /> {item.likes_count || 0}</span>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-400 col-span-full">
                  No saved items
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GamingProfile;
