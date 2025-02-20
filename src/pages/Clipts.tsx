
import React from 'react';
import { useNavigate } from "react-router-dom";
import GameBoyControls from "@/components/GameBoyControls";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { BackButton } from "@/components/ui/back-button";
import { Heart, MessageSquare, Trophy } from "lucide-react";

interface PostProfile {
  username: string;
  avatar_url: string;
}

interface Post {
  id: string;
  user_id: string;
  profiles: PostProfile;
  likes_count: number;
  comments_count: number;
  clip_votes: { count: number }[];
}

const Clipts = () => {
  const navigate = useNavigate();

  const { data: posts } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          user_id,
          profiles:user_id (username, avatar_url),
          likes_count,
          comments_count,
          clip_votes (count)
        `)
        .eq('type', 'video')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  return (
    <div className="min-h-screen bg-[#1a237e]">
      <div className="container mx-auto px-4 py-24">
        <div className="space-y-2">
          <div className="bg-[#283593]/80 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-indigo-400/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <span className="text-white/60">U</span>
                </div>
                <span className="text-white/80 font-mono">user_25b8440d</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4 text-red-400" />
                  <span className="text-white/60 text-sm">0</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="w-4 h-4 text-blue-400" />
                  <span className="text-white/60 text-sm">0</span>
                </div>
                <div className="flex items-center gap-1">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  <span className="text-white/60 text-sm">0</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#283593]/80 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-indigo-400/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <span className="text-white/60">A</span>
                </div>
                <span className="text-white/80 font-mono">Anonymous</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4 text-red-400" />
                  <span className="text-white/60 text-sm">0</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="w-4 h-4 text-blue-400" />
                  <span className="text-white/60 text-sm">0</span>
                </div>
                <div className="flex items-center gap-1">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  <span className="text-white/60 text-sm">0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <GameBoyControls />
    </div>
  );
}

export default Clipts;
