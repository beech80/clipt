import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  Plus, Video, Upload, Camera, Gamepad, Loader, 
  ChevronLeft, ChevronRight, Search, Clock
} from 'lucide-react';
import { Input } from '@/components/ui/input';

const PostSelection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPosts, setFilteredPosts] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Post categories for filtering
  const categories = [
    { id: 'all', name: 'All Posts', icon: <Search className="w-4 h-4" /> },
    { id: 'recent', name: 'Recent', icon: <Clock className="w-4 h-4" /> },
    { id: 'gaming', name: 'Gaming', icon: <Gamepad className="w-4 h-4" /> },
    { id: 'videos', name: 'Videos', icon: <Video className="w-4 h-4" /> },
  ];

  // Fetch user's recent posts
  useEffect(() => {
    const fetchRecentPosts = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);
          
        if (error) throw error;
        
        // Add placeholder content for posts without a description
        const processedData = data.map(post => ({
          ...post,
          content: post.content || 'No description provided',
          created_at_formatted: new Date(post.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }),
        }));
        
        setRecentPosts(processedData);
        setFilteredPosts(processedData);
      } catch (error: any) {
        console.error('Error fetching posts:', error.message);
        toast.error('Failed to load your posts');
        
        // Set sample data for development/fallback
        const samplePosts = generateSamplePosts();
        setRecentPosts(samplePosts);
        setFilteredPosts(samplePosts);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecentPosts();
  }, [user]);
  
  // Generate sample posts for development or when user has no posts
  const generateSamplePosts = () => {
    return Array.from({ length: 9 }, (_, i) => ({
      id: `sample-${i}`,
      title: `Sample Post ${i + 1}`,
      content: `This is a sample post description for item ${i + 1}`,
      image_url: `https://placehold.co/600x400/${getRandomColor()}/FFFFFF?text=Sample+Clip+${i + 1}`,
      video_url: i % 3 === 0 ? 'https://example.com/sample-video.mp4' : null,
      created_at_formatted: 'May 14, 2025',
      views_count: Math.floor(Math.random() * 1000),
      likes_count: Math.floor(Math.random() * 100),
      user_id: user?.id || 'unknown'
    }));
  };
  
  // Get random color for sample post thumbnails
  const getRandomColor = () => {
    const colors = ['232842', '2C3E50', '3498DB', '2980B9', '8E44AD', '9B59B6'];
    return colors[Math.floor(Math.random() * colors.length)];
  };
  
  // Handle search queries
  useEffect(() => {
    if (searchQuery.trim() === '' && selectedCategory === 'all') {
      setFilteredPosts(recentPosts);
      return;
    }
    
    let filtered = [...recentPosts];
    
    // Apply category filter
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'videos') {
        filtered = filtered.filter(post => post.video_url !== null);
      } else if (selectedCategory === 'gaming') {
        // For demo, just filter posts with gaming-related terms
        filtered = filtered.filter(post => 
          post.title?.toLowerCase().includes('game') || 
          post.content?.toLowerCase().includes('game')
        );
      } else if (selectedCategory === 'recent') {
        // Already sorted by recent, so just take the first 5
        filtered = filtered.slice(0, 5);
      }
    }
    
    // Apply search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        post => post.title?.toLowerCase().includes(query) || 
                post.content?.toLowerCase().includes(query)
      );
    }
    
    setFilteredPosts(filtered);
  }, [searchQuery, recentPosts, selectedCategory]);
  
  // Handle creating a new post
  const handleCreateNew = () => {
    navigate('/video-editor');
  };
  
  // Handle editing an existing post
  const handleEditPost = (postId: string) => {
    navigate(`/video-editor/${postId}`);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Cosmic background with starfield */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="stars-container">
          {Array.from({ length: 100 }).map((_, i) => {
            const size = Math.random() * 2 + 1;
            const top = Math.random() * 100;
            const left = Math.random() * 100;
            const animDuration = Math.random() * 3 + 2;
            
            return (
              <div 
                key={i}
                className="absolute rounded-full bg-white opacity-70"
                style={{ 
                  width: `${size}px`,
                  height: `${size}px`,
                  top: `${top}%`,
                  left: `${left}%`,
                  animation: `twinkle ${animDuration}s infinite ease-in-out ${Math.random() * 5}s`
                }}
              />
            );
          })}
        </div>
      </div>
      
      <div className="container mx-auto pt-16 pb-24 px-4 relative z-10">
        {/* Header Section */}
        <div className="text-center mb-8">
          <motion.h1 
            className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Select a Post to Edit
          </motion.h1>
          <motion.p 
            className="text-gray-400 max-w-xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Choose an existing post to edit or create a new one with our advanced video editing tools
          </motion.p>
        </div>
        
        {/* New Post Button */}
        <motion.div 
          className="mb-8 flex justify-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Button 
            onClick={handleCreateNew} 
            className="px-6 py-6 rounded-xl font-semibold flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-none shadow-lg hover:shadow-xl transition-all"
            size="lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            <span>Create New Post</span>
          </Button>
        </motion.div>
        
        {/* Search and Filter */}
        <motion.div 
          className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <div className="w-full md:w-auto flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <Input
                type="text"
                placeholder="Search your posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-900/50 border-gray-700 text-white"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                className={`flex items-center whitespace-nowrap ${
                  selectedCategory === category.id 
                    ? "bg-purple-600 hover:bg-purple-700 text-white" 
                    : "bg-gray-800/50 text-gray-300 hover:text-white"
                }`}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.icon}
                <span className="ml-2">{category.name}</span>
              </Button>
            ))}
          </div>
        </motion.div>
        
        {/* Posts Grid */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          {loading ? (
            <div className="col-span-full flex justify-center py-20">
              <div className="flex flex-col items-center">
                <Loader className="w-10 h-10 text-purple-500 animate-spin" />
                <p className="mt-4 text-gray-400">Loading your posts...</p>
              </div>
            </div>
          ) : filteredPosts.length > 0 ? (
            filteredPosts.map((post, index) => (
              <motion.div
                key={post.id}
                className="relative group overflow-hidden rounded-xl border border-gray-800 bg-gray-900/50 backdrop-blur-sm hover:shadow-lg hover:shadow-purple-900/20 transition-all"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * (index % 6) }}
                whileHover={{ y: -5 }}
              >
                {/* Video indicator if this post has video */}
                {post.video_url && (
                  <div className="absolute top-3 right-3 z-10 bg-black/60 rounded-full p-1.5">
                    <Video className="w-4 h-4 text-purple-400" />
                  </div>
                )}
                
                {/* Post thumbnail */}
                <div className="aspect-video bg-gray-800 relative overflow-hidden">
                  <img 
                    src={post.image_url || 'https://placehold.co/600x400/252944/FFFFFF?text=No+Thumbnail'} 
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Edit button - only appears on hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Button
                      onClick={() => handleEditPost(post.id)}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transform transition-transform duration-300 scale-90 group-hover:scale-100"
                    >
                      Edit This Post
                    </Button>
                  </div>
                </div>
                
                {/* Post info */}
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1 line-clamp-1">{post.title}</h3>
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">{post.content}</p>
                  
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>{post.created_at_formatted}</span>
                    <div className="flex space-x-3">
                      <span>{post.views_count || 0} views</span>
                      <span>{post.likes_count || 0} likes</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-12 flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-purple-900/30 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No posts found</h3>
              <p className="text-gray-400 text-center max-w-md">
                {searchQuery 
                  ? `No posts match your search for "${searchQuery}"`
                  : "You don't have any posts yet. Create your first post!"}
              </p>
              <Button
                onClick={handleCreateNew}
                className="mt-6 bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Post
              </Button>
            </div>
          )}
        </motion.div>
        
        {/* Navigation */}
        <div className="mt-8 flex justify-center">
          <Button 
            onClick={() => navigate('/')}
            variant="ghost" 
            className="text-gray-400 hover:text-white"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
      
      {/* Animated CSS for twinkling stars */}
      <style jsx>{`
        @keyframes twinkle {
          0% { opacity: 0.3; }
          50% { opacity: 1; }
          100% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
};

export default PostSelection;
