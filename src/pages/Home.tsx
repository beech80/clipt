import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import PostItem from "@/components/PostItem";
import { cn } from "@/lib/utils";
import GameCategories from "@/components/GameCategories";
import { useNavigate } from "react-router-dom";
import { Camera } from "lucide-react";
import { Post } from '@/types/post';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showMentionSearch, setShowMentionSearch] = useState(false);
  const [mentionSearchQuery, setMentionSearchQuery] = useState('');
  const [mentionResults, setMentionResults] = useState<any[]>([]);
  const [mentionLoading, setMentionLoading] = useState(false);
  const [postContent, setPostContent] = useState('');
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [mentionTriggerPosition, setMentionTriggerPosition] = useState({ top: 0, left: 0 });

  const { data: posts, isLoading, error } = useQuery({
    queryKey: ['posts', 'home'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url,
            display_name
          ),
          games:game_id (name),
          likes:likes(count),
          clip_votes:clip_votes(count)
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching posts:", error);
        throw error;
      }

      // Ensure each post has a properly formatted id
      const formattedPosts = data?.map(post => ({
        ...post,
        id: post.id.toString(), // Ensure ID is a string
        likes_count: post.likes?.[0]?.count || 0,
        clip_votes: post.clip_votes || []
      })) as Post[];

      console.log("Posts fetched:", formattedPosts);
      return formattedPosts;
    },
  });

  // Function to handle text change and detect @ mentions
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setPostContent(newContent);
    
    // Check if user is typing an @ mention
    const atIndex = newContent.lastIndexOf('@');
    if (atIndex !== -1 && (atIndex === 0 || newContent[atIndex - 1] === ' ')) {
      const query = newContent.substring(atIndex + 1).split(' ')[0];
      
      if (query) {
        setMentionSearchQuery(query);
        setShowMentionSearch(true);
        searchUsers(query);
      } else {
        setShowMentionSearch(false);
      }
    } else {
      setShowMentionSearch(false);
    }
  };

  // Function to search for users
  const searchUsers = async (query: string) => {
    if (query.length < 1) {
      setMentionResults([]);
      return;
    }
    
    setMentionLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, display_name')
        .ilike('username', `%${query}%`)
        .limit(5);
        
      if (error) throw error;
      
      setMentionResults(data || []);
    } catch (error) {
      console.error('Error searching for users:', error);
    } finally {
      setMentionLoading(false);
    }
  };

  // Function to insert mention
  const insertMention = (username: string) => {
    if (!textAreaRef.current) return;
    
    const cursorPos = textAreaRef.current.selectionStart;
    const text = postContent;
    
    // Find the position of the @ that triggered this mention
    const atIndex = text.lastIndexOf('@', cursorPos - 1);
    if (atIndex === -1) return;
    
    // Replace the partial mention with the full username
    const newText = text.substring(0, atIndex) + '@' + username + ' ' + text.substring(cursorPos);
    setPostContent(newText);
    
    // Close mention search
    setShowMentionSearch(false);
    
    // Set focus back to textarea with cursor at the right position
    setTimeout(() => {
      if (textAreaRef.current) {
        textAreaRef.current.focus();
        const newCursorPos = atIndex + username.length + 2; // +2 for @ and space
        textAreaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  if (error) {
    return <div className="text-center py-10">Failed to load posts. Please try again later.</div>;
  }

  return (
    <div className="relative min-h-screen bg-gaming-900 pb-20">
      {/* Modern Header with Gradient */}
      <div className="w-full py-6 px-4 bg-gradient-to-b from-gaming-800/80 to-transparent backdrop-blur-sm">
        <h1 className="text-center text-3xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
          Squads Clipts
        </h1>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Main feed */}
        <div className="space-y-6 max-w-2xl mx-auto">
          {/* Text area with mention functionality */}
          <div className="mb-6 relative">
            <textarea
              ref={textAreaRef}
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white resize-none min-h-[100px]"
              placeholder="What's on your mind? Use @ to mention someone..."
              value={postContent}
              onChange={handleContentChange}
            />
            
            {showMentionSearch && (
              <div className="absolute z-10 bg-gray-800 border border-gray-700 rounded-lg shadow-lg mt-1 w-full max-w-xs">
                {mentionLoading ? (
                  <div className="p-3 flex justify-center">
                    <Loader2 className="animate-spin h-5 w-5 text-gray-400" />
                  </div>
                ) : mentionResults.length > 0 ? (
                  <div className="py-1">
                    {mentionResults.map((user) => (
                      <button
                        key={user.id}
                        className="w-full px-4 py-2 flex items-center gap-2 hover:bg-gray-700 text-left"
                        onClick={() => insertMention(user.username)}
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.avatar_url || ''} />
                          <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-white">{user.username}</span>
                        {user.display_name && (
                          <span className="text-xs text-gray-400">{user.display_name}</span>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 text-sm text-gray-400">
                    No users found matching "{mentionSearchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Posts */}
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500"></div>
            </div>
          ) : posts && posts.length > 0 ? (
            posts.map((post) => (
              <PostItem key={post.id} post={post} />
            ))
          ) : (
            <div className="text-center py-20 text-gray-400">
              <Camera className="mx-auto h-16 w-16 text-gray-600 mb-4" />
              <p className="text-xl font-semibold text-white mb-2">No posts available</p>
              <p>Create your first post!</p>
              <button 
                className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                onClick={() => navigate('/clipts/create')}
              >
                Create Post
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
