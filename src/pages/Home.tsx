import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import PostItem from "@/components/PostItem";
import { cn } from "@/lib/utils";
import GameCategories from "@/components/GameCategories";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Camera } from "lucide-react";
import { Post } from '@/types/post';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Modified to always return empty array
  const { data: posts, isLoading, error } = useQuery({
    queryKey: ['posts', 'home'],
    queryFn: async () => {
      // Force return empty array - no posts
      return [] as Post[];
    },
  });

  return (
    <div className="relative min-h-screen bg-gaming-900">
      {/* Modern Header with Gradient and Blur */}
      <div className="w-full py-6 px-4 bg-gradient-to-b from-gaming-800/80 to-transparent backdrop-blur-sm">
        <h1 className="text-center text-3xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
          Squads Clipts
        </h1>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Main feed */}
        <div className="space-y-6 max-w-2xl mx-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-20 text-red-400">
              <p>Failed to load posts. Please try again later.</p>
            </div>
          ) : posts && posts.length > 0 ? (
            posts.map((post) => (
              <PostItem key={post.id} post={post} />
            ))
          ) : (
            <div className="text-center py-20 text-gray-400">
              <p className="text-xl font-semibold mb-2">No posts available. Create your first post!</p>
              <p className="text-sm text-gray-500">Share both videos and images in your squad feed.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
