import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { MessageSquare, ThumbsUp, Trophy, Share2, ExternalLink } from 'lucide-react';

const PostPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a237e] to-[#0d1b3c]">
      <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-black/40 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center justify-center max-w-7xl mx-auto relative">
          <BackButton />
          <h1 className="text-3xl font-bold text-white">Post</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-24 pb-20 max-w-2xl">
        <div className="bg-black/30 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 shadow-xl mb-4">
          {/* Post Author */}
          <div className="p-4 border-b border-white/10 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">
              U
            </div>
            <div>
              <p className="font-medium text-white">Username</p>
              <p className="text-xs text-gray-400">2 hours ago</p>
            </div>
          </div>
          
          {/* Post Content */}
          <div className="p-4">
            <h2 className="text-xl font-semibold text-white mb-2">Example Post Title</h2>
            <p className="text-gray-300">This is a detailed view of post ID: {id}</p>
            
            {/* Placeholder for media content */}
            <div className="mt-4 rounded-lg bg-gray-800 aspect-video flex items-center justify-center">
              <p className="text-gray-400">Media content would appear here</p>
            </div>
          </div>
          
          {/* Post Actions */}
          <div className="px-4 py-3 bg-black/40 flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <button className="flex items-center text-gray-300 hover:text-purple-400">
                <ThumbsUp className="mr-1 h-5 w-5" />
                <span className="text-sm">24</span>
              </button>
              <button className="flex items-center text-gray-300 hover:text-purple-400">
                <MessageSquare className="mr-1 h-5 w-5" />
                <span className="text-sm">8</span>
              </button>
              <button 
                className="flex items-center text-gray-300 hover:text-purple-400"
                onClick={() => navigate(`/post/${id}/comments`)}
              >
                <span className="text-xs ml-1 underline text-purple-400">See all comments</span>
              </button>
              <button className="flex items-center text-gray-300 hover:text-purple-400">
                <Trophy className="mr-1 h-5 w-5" />
              </button>
            </div>
            <button className="text-gray-300 hover:text-purple-400">
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* Comments section */}
        <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 border border-white/10 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white">Comments</h3>
            
            {/* Link to dedicated comments page */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/post/${id}/comments`)}
              className="text-xs flex items-center gap-1 text-purple-400 hover:text-purple-300 hover:bg-purple-950/30"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View All Comments
            </Button>
          </div>
          
          {/* Comment input */}
          <div className="flex space-x-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-purple-600 flex-shrink-0"></div>
            <div className="flex-1 relative">
              <input 
                type="text" 
                placeholder="Add a comment..." 
                className="w-full bg-gray-800/50 border border-gray-700 rounded-full py-2 px-4 text-white placeholder:text-gray-400"
              />
              <Button 
                size="sm" 
                className="absolute right-1 top-1 h-7 bg-purple-600 hover:bg-purple-700 rounded-full"
              >
                Post
              </Button>
            </div>
          </div>
          
          <div className="space-y-4">
            <p className="text-center text-gray-400 py-4">No comments yet. Be the first to comment!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostPage;
