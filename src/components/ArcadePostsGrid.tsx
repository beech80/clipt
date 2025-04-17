import React from 'react';
import { motion } from 'framer-motion';
import { Film, Image as ImageIcon, MessageSquare, Heart, Award } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  video_url: string | null;
  created_at: string;
  profile_id: string;
  likes_count: number;
  comments_count: number;
}

interface ArcadePostsGridProps {
  posts: Post[];
  onPostClick: (post: Post) => void;
}

const ArcadePostsGrid: React.FC<ArcadePostsGridProps> = ({ posts, onPostClick }) => {
  // Animation variants for container
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  // Animation variants for individual items
  const itemVariants = {
    hidden: { scale: 0.8, opacity: 0, y: 20 },
    visible: {
      scale: 1,
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 260,
        damping: 20
      }
    },
    hover: {
      scale: 1.05,
      y: -5,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 10
      }
    },
    tap: {
      scale: 0.95,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 10
      }
    }
  };

  return (
    <div className="profile-container">
      <div className="scanlines"></div>
      
      {posts.length === 0 ? (
        <motion.div 
          className="profile-empty-state"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Film className="w-16 h-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-bold text-gaming-100 mb-2">No Posts Yet</h3>
          <p className="text-gaming-300">Posts you create will appear here.</p>
        </motion.div>
      ) : (
        <motion.div 
          className="posts-arcade"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {posts.map((post) => (
            <motion.div
              key={post.id}
              className="post-cabinet spotlight glitch-hover"
              variants={itemVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={() => onPostClick(post)}
            >
              <div className="post-cabinet-screen">
                {post.image_url ? (
                  <img 
                    src={post.image_url} 
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                ) : post.video_url ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-900">
                    <Film className="w-10 h-10 text-gaming-300" />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-900">
                    <div className="text-gaming-300 text-sm p-2 text-center">
                      {post.content.substring(0, 50)}
                      {post.content.length > 50 ? '...' : ''}
                    </div>
                  </div>
                )}
                
                <div className="post-type-indicator">
                  {post.video_url ? (
                    <Film size={14} />
                  ) : post.image_url ? (
                    <ImageIcon size={14} />
                  ) : (
                    <MessageSquare size={14} />
                  )}
                </div>
                
                <div className="post-title">{post.title}</div>
                
                <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 py-1 bg-black bg-opacity-60 text-xs">
                  <div className="flex items-center">
                    <Heart size={10} className="mr-1 text-red-500" />
                    <span>{post.likes_count}</span>
                  </div>
                  <div className="flex items-center">
                    <MessageSquare size={10} className="mr-1 text-blue-400" />
                    <span>{post.comments_count}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default ArcadePostsGrid;
