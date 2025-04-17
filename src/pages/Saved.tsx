import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Bookmark, BookmarkX, Trophy, Calendar, Eye } from 'lucide-react';
import { getSavedClipts, unsaveClipt } from '@/lib/savedClipts';
import TabsNavigation from '@/components/TabsNavigation';
import FallbackVideoPlayer from '@/components/video/FallbackVideoPlayer';
import { toast } from 'sonner';

// Define the type for our saved clipt items
interface SavedCliptItem {
  id: string;
  postId: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  title?: string;
  savedAt: string;
  post?: {
    id: string;
    content?: string;
    title?: string;
    imageUrl?: string;
    videoUrl?: string;
    likesCount?: number;
    viewsCount?: number;
    author?: {
      username?: string;
      displayName?: string;
      avatarUrl?: string;
    }
  }
}

const Saved = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({});
  
  // Fetch saved clipts using our new function
  const { data: savedClipts, isLoading, error, refetch } = useQuery({
    queryKey: ['saved-clipts'],
    queryFn: async () => {
      if (!user) return { success: false, data: [] };
      
      const result = await getSavedClipts(user.id);
      
      if (!result.success) {
        console.error('Error fetching saved clipts:', result.error);
        return { success: false, data: [] };
      }
      
      return result;
    },
    enabled: !!user,
    select: (data) => data.success ? data.data : []
  });

  // Handle removing a clipt from saved collection
  const handleUnsave = async (postId: string) => {
    if (!user) return;
    
    setIsDeleting(prev => ({ ...prev, [postId]: true }));
    
    try {
      const result = await unsaveClipt(user.id, postId);
      
      if (result.success) {
        // Update the UI by refetching data
        refetch();
      }
    } catch (error) {
      console.error('Error removing saved clipt:', error);
      toast.error('Failed to remove clipt from collection');
    } finally {
      setIsDeleting(prev => ({ ...prev, [postId]: false }));
    }
  };
  
  // Handle clicking on a clipt to view it
  const handleCliptClick = (postId: string) => {
    navigate(`/post/${postId}`);
  };
  
  return (
    <div className="relative min-h-screen bg-gaming-900">
      <TabsNavigation />
      
      <motion.div 
        className="pt-16 container mx-auto px-4 py-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-center text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-500">
          <Bookmark className="inline-block mr-2 mb-1" /> Saved Clipts
        </h1>
        <p className="text-center text-gray-400 mb-8">Your favorite gaming moments, all in one place</p>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-400">
            <p>Failed to load saved clipts. Please try again later.</p>
          </div>
        ) : savedClipts && savedClipts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedClipts.map((clipt: SavedCliptItem) => (
              <motion.div 
                key={clipt.id}
                className="bg-gaming-800 rounded-lg overflow-hidden clipt-card relative"
                whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div 
                  className="clipt-video-container relative cursor-pointer" 
                  onClick={() => handleCliptClick(clipt.postId)}
                >
                  {clipt.videoUrl ? (
                    <div className="aspect-video w-full clipt-video">
                      <FallbackVideoPlayer
                        videoUrl={clipt.videoUrl}
                        postId={clipt.postId}
                        thumbnail={clipt.thumbnailUrl}
                        autoPlay={false}
                        muted={true}
                        controls={false}
                        className="w-full h-full"
                      />
                    </div>
                  ) : clipt.thumbnailUrl ? (
                    <div className="aspect-video w-full overflow-hidden clipt-thumbnail">
                      <img 
                        src={clipt.thumbnailUrl} 
                        alt={clipt.title || 'Saved clipt thumbnail'} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video w-full bg-gaming-700 flex items-center justify-center">
                      <span className="text-gray-400">No preview available</span>
                    </div>
                  )}
                  
                  {/* Hover play indicator */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="bg-purple-700/80 p-3 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="white">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="font-bold text-lg text-white truncate">
                    {clipt.title || clipt.post?.title || 'Saved Clipt'}
                  </h3>
                  
                  {clipt.post?.author && (
                    <p className="text-gray-400 text-sm mt-1">
                      by {clipt.post.author.displayName || clipt.post.author.username || 'Unknown Gamer'}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex space-x-3 text-sm text-gray-400">
                      {clipt.post?.viewsCount !== undefined && (
                        <span className="flex items-center">
                          <Eye className="w-4 h-4 mr-1" /> 
                          {clipt.post.viewsCount}
                        </span>
                      )}
                      
                      {clipt.post?.likesCount !== undefined && (
                        <span className="flex items-center">
                          <Trophy className="w-4 h-4 mr-1" /> 
                          {clipt.post.likesCount}
                        </span>
                      )}
                      
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" /> 
                        {new Date(clipt.savedAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <button
                      className="text-gray-400 hover:text-red-400 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnsave(clipt.postId);
                      }}
                      disabled={isDeleting[clipt.postId]}
                    >
                      {isDeleting[clipt.postId] ? (
                        <div className="w-5 h-5 rounded-full border-2 border-t-red-400 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                      ) : (
                        <BookmarkX className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div 
            className="text-center py-20 rounded-xl bg-gaming-800/60 backdrop-blur-sm border border-purple-900/30"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Bookmark className="w-16 h-16 mx-auto text-purple-400 mb-4 opacity-60" />
            <h2 className="text-2xl font-bold text-white mb-2">No saved clipts yet</h2>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              When you find great gaming moments, use the bookmark button to save them to your collection.
            </p>
            <button 
              onClick={() => navigate('/clipts')}
              className="px-6 py-3 bg-purple-700 hover:bg-purple-600 rounded-full font-medium text-white transition-colors"
            >
              Discover Clipts
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default Saved;
