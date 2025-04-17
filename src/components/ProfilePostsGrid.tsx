import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Film, Image, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Post {
  id: string;
  content?: string;
  title?: string;
  image_url?: string;
  video_url?: string;
  created_at: string;
}

interface ProfilePostsGridProps {
  posts: Post[];
  isLoading: boolean;
  isOwnProfile: boolean;
}

const ProfilePostsGrid: React.FC<ProfilePostsGridProps> = ({
  posts,
  isLoading,
  isOwnProfile
}) => {
  const navigate = useNavigate();
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.05
      }
    }
  };
  
  const itemVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: { duration: 0.3 }
    }
  };

  if (isLoading) {
    return (
      <div className="arcade-frame p-6 text-center">
        <div className="loading-squares mb-4">
          <div className="loading-square"></div>
          <div className="loading-square"></div>
          <div className="loading-square"></div>
        </div>
        <p className="text-purple-300">Loading posts...</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <motion.div 
        className="arcade-frame profile-empty-state"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <AlertCircle className="h-16 w-16 mx-auto mb-4 text-purple-400" />
        <h3 className="text-xl font-semibold mb-2 neon-text">No Posts Yet</h3>
        <p className="text-muted-foreground mb-6">This player hasn't shared any posts yet.</p>
        
        {isOwnProfile && (
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              onClick={() => navigate('/post-form')} 
              className="gameboy-button"
            >
              Share Your First Post
            </Button>
          </motion.div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="arcade-grid"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="profile-post-grid">
        {posts.map((post) => (
          <motion.div 
            key={post.id} 
            className={`profile-post-item ${post.video_url ? 'video' : ''}`}
            variants={itemVariants}
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 0 15px rgba(139, 92, 246, 0.5)"
            }}
            onClick={() => navigate(`/post/${post.id}`)}
          >
            {post.video_url ? (
              <div className="relative w-full h-full bg-gray-900">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Film className="w-10 h-10 text-white opacity-75" />
                </div>
                <div className="absolute top-2 right-2 bg-black/60 p-1 rounded-full">
                  <Film className="w-3 h-3 text-white" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                  <p className="text-xs text-white truncate">{post.title || post.content || 'Video post'}</p>
                </div>
              </div>
            ) : post.image_url ? (
              <div className="relative w-full h-full">
                <img 
                  src={post.image_url} 
                  alt={post.content || 'Post image'} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://placehold.co/400x400/121212/303030?text=Image';
                  }}
                />
                <div className="absolute top-2 right-2 bg-black/60 p-1 rounded-full">
                  <Image className="w-3 h-3 text-white" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                  <p className="text-xs text-white truncate">{post.title || post.content || 'Image post'}</p>
                </div>
              </div>
            ) : (
              <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center p-3 relative">
                <FileText className="w-8 h-8 mb-2 text-purple-400" />
                <p className="text-xs text-center text-gray-300 line-clamp-3">{post.title || post.content || 'Text post'}</p>
                <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-purple-900/20 to-transparent"></div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default ProfilePostsGrid;
