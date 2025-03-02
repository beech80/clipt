import React from 'react';
import { Menu, Camera, Heart, MessageSquare, User, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { handleVideoControl } from './gameboy/VideoControls';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface GameBoyControlsProps {
  currentPostId?: string;
}

const GameBoyControls: React.FC<GameBoyControlsProps> = ({ currentPostId }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLike = async () => {
    if (!user || !currentPostId) {
      navigate('/login');
      return;
    }

    try {
      // Check if user already liked this post
      const { data: existingLike } = await supabase
        .from('likes')
        .select('*')
        .eq('user_id', user.id)
        .eq('post_id', currentPostId)
        .single();

      if (existingLike) {
        // Unlike
        await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', currentPostId);
        
        toast.success('Unliked post');
      } else {
        // Like
        await supabase
          .from('likes')
          .insert([{ user_id: user.id, post_id: currentPostId }]);
        
        toast.success('Liked post!');
      }
    } catch (error) {
      toast.error('Failed to like post. Please try again.');
    }
  };

  const handleComment = () => {
    // Implementation of comment functionality
    toast('Opening comments');
  };

  const handleFollow = async () => {
    if (!user || !currentPostId) {
      navigate('/login');
      return;
    }

    try {
      // Get post creator id
      const { data: post } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', currentPostId)
        .single();
      
      if (!post) {
        toast.error('Post not found');
        return;
      }

      // Check if user already follows this creator
      const { data: existingFollow } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', user.id)
        .eq('following_id', post.user_id)
        .single();

      if (existingFollow) {
        // Unfollow
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', post.user_id);
        
        toast.success('Unfollowed user');
      } else {
        // Follow
        await supabase
          .from('follows')
          .insert([{ follower_id: user.id, following_id: post.user_id }]);
        
        toast.success('Now following user!');
      }
    } catch (error) {
      toast.error('Failed to follow. Please try again.');
    }
  };

  const handleRank = async () => {
    if (!user || !currentPostId) {
      navigate('/login');
      return;
    }

    try {
      // Check if user already ranked this post
      const { data: existingVote } = await supabase
        .from('clip_votes')
        .select('*')
        .eq('user_id', user.id)
        .eq('post_id', currentPostId)
        .single();

      if (existingVote) {
        // Remove rank
        await supabase
          .from('clip_votes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', currentPostId);
        
        toast.success('Rank removed');
      } else {
        // Rank
        await supabase
          .from('clip_votes')
          .insert([{ user_id: user.id, post_id: currentPostId }]);
        
        toast.success('Clip ranked!');
      }
    } catch (error) {
      toast.error('Failed to rank clip. Please try again.');
    }
  };

  const navigationItems = [
    { name: 'Home', path: '/' },
    { name: 'Discover', path: '/discover' },
    { name: 'Messages', path: '/messages' },
    { name: 'Profile', path: '/profile' },
    { name: 'Streaming', path: '/streaming' },
    { name: 'Top Clips', path: '/top-clips' },
    { name: 'Clipts', path: '/clipts' },
    { name: 'AI Assistant', path: '/ai-assistant' },
    { name: 'Settings', path: '/settings' },
    { name: 'Esports', path: '/esports' }
  ];

  return (
    <div className="h-[70px] bg-[#171923] fixed bottom-0 left-0 right-0 z-50 touch-none border-t border-[#2d3748]/30 flex items-center justify-between">
      {/* Joystick on left */}
      <div className="flex-none pl-5">
        <div className="w-20 h-20 bg-[#2d3748]/20 rounded-full border border-[#2d3748]/30 flex items-center justify-center">
          <div className="w-16 h-16 bg-[#141721] rounded-full border border-[#2d3748]/20 flex items-center justify-center">
            <div className="w-4 h-4 bg-[#2d3748]/40 rounded-full"></div>
          </div>
        </div>
      </div>
      
      {/* CLIPT button in center with gradient background */}
      <div className="absolute left-1/2 transform -translate-x-1/2 top-[-25px]">
        <button 
          onClick={() => {
            navigate('/clipts');
            toast.success('Welcome to Clipts!');
          }}
          className="relative flex items-center justify-center w-16 h-16 active:scale-95 transition-transform"
          aria-label="Go to Clipts"
        >
          <div className="absolute inset-0 rounded-full border-2 border-transparent bg-clip-padding p-[2px]" 
               style={{ background: 'linear-gradient(135deg, #4f9cf9, #a651fb, #f046ff) border-box' }}>
            <div className="w-full h-full rounded-full bg-[#171923] flex items-center justify-center">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="absolute bottom-[-14px] text-center w-full">
            <span className="text-[10px] text-white font-bold tracking-wider">CLIPT</span>
          </div>
        </button>
      </div>
      
      {/* Action buttons on right */}
      <div className="flex-none pr-5">
        <div className="relative w-20 h-20 flex items-center justify-center">
          {/* Heart button (top) */}
          <button 
            onClick={handleLike}
            className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-transparent flex items-center justify-center"
          >
            <Heart className="w-6 h-6 text-red-500" />
          </button>
          
          {/* Message button (left) */}
          <button 
            onClick={handleComment}
            className="absolute left-[-15px] top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-transparent flex items-center justify-center"
          >
            <MessageSquare className="w-6 h-6 text-blue-400" />
          </button>
          
          {/* Follow button (right) */}
          <button 
            onClick={handleFollow}
            className="absolute right-[-15px] top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-transparent flex items-center justify-center"
          >
            <User className="w-6 h-6 text-green-400" />
          </button>
          
          {/* Trophy button (bottom) */}
          <button 
            onClick={handleRank}
            className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-transparent flex items-center justify-center"
          >
            <Trophy className="w-6 h-6 text-yellow-400" />
          </button>
          
          {/* POST button */}
          <button
            onClick={() => navigate('/post/new')}
            className="absolute -bottom-12 right-0 rounded-full bg-[#9c27b0] px-3 py-1 text-xs text-white font-bold"
          >
            POST
          </button>
        </div>
      </div>
      
      {/* Menu button at bottom center */}
      <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2">
        <Sheet>
          <SheetTrigger asChild>
            <button className="w-10 h-10 rounded-full bg-[#2d3748]/30 flex items-center justify-center">
              <Menu className="w-5 h-5 text-white" />
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="w-full max-w-xl mx-auto rounded-t-xl bg-[#171923]/95 backdrop-blur-xl border-[#3e4462]/30">
            <nav className="grid grid-cols-2 gap-2 p-3">
              {navigationItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    toast.success(`Navigating to ${item.name}`);
                  }}
                  className="flex items-center gap-2 p-3 sm:p-4 rounded-lg bg-[#2d3748]/20 hover:bg-[#2d3748]/30 
                    active:bg-[#2d3748]/40 transition-all duration-300 text-white/80 
                    font-medium text-sm sm:text-base active:scale-95"
                >
                  <span>{item.name}</span>
                </button>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

export default GameBoyControls;
