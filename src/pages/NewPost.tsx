import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { BackButton } from '@/components/ui/back-button';
import { Camera, Upload, X, Video, Image as ImageIcon, Search, Gamepad2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { allGames } from '@/data/gamesList';
import { motion, AnimatePresence } from 'framer-motion';
import '../stars-bg.css';

const NewPost = () => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  } as const;
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 25 }
    }
  } as const;
  
  const shimmerVariants = {
    hidden: { backgroundPosition: '200% 0' },
    visible: { 
      backgroundPosition: '-200% 0',
      transition: { repeat: Infinity, duration: 3, ease: "linear" }
    }
  } as const;
  
  const pulseVariants = {
    hidden: { scale: 0.97, opacity: 0.7 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: { 
        repeat: Infinity, 
        repeatType: "reverse" as const, 
        duration: 1.5 
      }
    }
  } as const;

  const navigate = useNavigate();
  const location = useLocation();
  const [postDestination, setPostDestination] = useState('clipts'); // Default to clipts for edited videos
  const [description, setDescription] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviewUrls, setMediaPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [clipId, setClipId] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  
  // Add game selection state
  const [selectedGame, setSelectedGame] = useState<{ id: string; name: string } | null>(null);
  const [gameSearch, setGameSearch] = useState('');
  const [gameSearchResults, setGameSearchResults] = useState<typeof allGames>([]);
  const [showGameSearch, setShowGameSearch] = useState(false);
  
  // Prevent scrolling in a more targeted way
  useEffect(() => {
    // Simple scroll prevention for just this component
    const handleScroll = (e) => {
      if (e.target === document || e.target === document.body || e.target === document.documentElement) {
        window.scrollTo(0, 0);
        e.preventDefault();
        return false;
      }
    };

    // Only prevent wheel/touch events at the document level
    window.addEventListener('wheel', handleScroll, { passive: false });
    window.addEventListener('touchmove', handleScroll, { passive: false });
    
    // Add overflow hidden directly to body
    document.body.style.overflow = 'hidden';
    
    // Create a targeted style for just our component wrapper
    const styleElement = document.createElement('style');
    styleElement.id = 'cosmic-post-style';
    styleElement.textContent = `
      .min-h-screen.bg-gradient-to-b {
        position: fixed !important;
        inset: 0 !important;
        overflow: hidden !important;
        height: 100vh !important;
        width: 100vw !important;
        max-height: 100vh !important;
        z-index: 9999 !important;
      }
      
      /* Hide scrollbar */
      ::-webkit-scrollbar {
        width: 0px;
        display: none;
      }
      
      * {
        scrollbar-width: none;
      }
    `;
    document.head.appendChild(styleElement);
    
    return () => {
      // Clean up event listeners
      window.removeEventListener('wheel', handleScroll);
      window.removeEventListener('touchmove', handleScroll);
      
      // Restore body overflow
      document.body.style.overflow = 'auto';
      
      // Remove style element
      document.getElementById('cosmic-post-style')?.remove();
    };
  }, []);
  
  // Check for cosmic video upload data in localStorage
  useEffect(() => {
    // First check localStorage for cosmic uploader data
    const savedUploadData = localStorage.getItem('clipt_upload_data');
    
    if (savedUploadData) {
      try {
        const uploadData = JSON.parse(savedUploadData);
        setVideoUrl(uploadData.videoUrl);
        if (uploadData.thumbnailUrl) {
          // Add the thumbnail to preview URLs if available
          setMediaPreviewUrls([uploadData.thumbnailUrl]);
        }
        if (uploadData.clipId) {
          setClipId(uploadData.clipId);
        }
        setPostDestination('clipts');
        toast.success('Cosmic video ready for posting! Add a caption and select a game.');
        
        // Clear the localStorage after using it
        localStorage.removeItem('clipt_upload_data');
      } catch (error) {
        console.error('Error parsing upload data:', error);
      }
    } else {
      // Fall back to URL parameters
      const params = new URLSearchParams(location.search);
      const clipIdParam = params.get('clipId');
      const videoUrlParam = params.get('videoUrl');
      
      if (clipIdParam && videoUrlParam) {
        setClipId(clipIdParam);
        setVideoUrl(videoUrlParam);
        setPostDestination('clipts');
        
        // No need to add to mediaPreviewUrls - we'll handle it separately
        toast.success('Video ready for posting! Add a caption and select a game.');
      }
    }
  }, [location.search]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate number of files
    if (mediaFiles.length + files.length > 5) {
      toast.error('You can only upload a maximum of 5 files');
      return;
    }
    
    // Validate file types - allow both images and videos always
    const validFiles = files.filter(file => 
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );
    
    if (validFiles.length !== files.length) {
      toast.error('Only image and video files are supported');
      return;
    }
    
    // Validate file size
    const oversizedFiles = files.filter(file => file.size > 50 * 1024 * 1024); // 50MB
    if (oversizedFiles.length > 0) {
      toast.error('Files must be smaller than 50MB');
      return;
    }
    
    // Create preview URLs for the files
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    
    setMediaFiles(prev => [...prev, ...files]);
    setMediaPreviewUrls(prev => [...prev, ...newPreviewUrls]);
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(mediaPreviewUrls[index]);
    
    setMediaFiles(prev => {
      const newFiles = [...prev];
      newFiles.splice(index, 1);
      return newFiles;
    });
    
    setMediaPreviewUrls(prev => {
      const newUrls = [...prev];
      newUrls.splice(index, 1);
      return newUrls;
    });
  };

  const handleGameSearch = (searchTerm: string) => {
    setGameSearch(searchTerm);
    
    if (!searchTerm.trim()) {
      setGameSearchResults([]);
      return;
    }
    
    const searchTermLower = searchTerm.toLowerCase();
    
    // Filter games based on search term with prioritization
    const exactMatches = allGames.filter(game => 
      game.name.toLowerCase() === searchTermLower
    );
    
    const startsWithMatches = allGames.filter(game => 
      game.name.toLowerCase().startsWith(searchTermLower) && 
      !exactMatches.some(match => match.id === game.id)
    );
    
    const containsMatches = allGames.filter(game => 
      game.name.toLowerCase().includes(searchTermLower) && 
      !exactMatches.some(match => match.id === game.id) && 
      !startsWithMatches.some(match => match.id === game.id)
    );
    
    // Limit results and sort alphabetically within priority groups
    const combinedResults = [...exactMatches, ...startsWithMatches, ...containsMatches].slice(0, 10);
    
    setGameSearchResults(combinedResults);
  };

  const handleGameSelect = (game: { id: string; name: string }) => {
    setSelectedGame(game);
    setGameSearch('');
    setGameSearchResults([]);
    setShowGameSearch(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate the post
    if (!description.trim()) {
      toast.error('Please add a description');
      return;
    }
    
    if (!selectedGame) {
      toast.error('Please select a game');
      return;
    }
    
    if (mediaFiles.length === 0 && !videoUrl) {
      toast.error('Please add media to your post');
      return;
    }
    
    if (postDestination === 'clipts') {
      const nonVideoFiles = mediaFiles.filter(file => !file.type.startsWith('video/'));
      if (nonVideoFiles.length > 0) {
        toast.error('Only video files are allowed for Clipts');
        return;
      }
    }
    
    try {
      // Show loading toast
      const uploadToast = toast.loading('Creating your post...');
      
      try {
        // 1. Get current user info
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('You must be logged in to create a post');
        
        let postVideoUrl = videoUrl; // Use existing video URL from clip if available
        let imageUrls = [];
        
        // 2. Upload files if they exist and we don't already have a video from ClipEditor
        if (mediaFiles.length > 0 && !postVideoUrl) {
          for (let i = 0; i < mediaFiles.length; i++) {
            const file = mediaFiles[i];
            const timestamp = Date.now() + i;
            const fileExt = file.name.split('.').pop();
            const filePath = `${user.id}/${timestamp}.${fileExt}`;
            
            // Upload file
            const { error: uploadError } = await supabase.storage
              .from('media')
              .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false,
              });
            
            if (uploadError) throw uploadError;
            
            const { data: { publicUrl } } = supabase.storage
              .from('media')
              .getPublicUrl(filePath);
            
            if (file.type.startsWith('video/')) {
              postVideoUrl = publicUrl;
            } else {
              imageUrls.push(publicUrl);
            }
          }
        }
        
        // 3. Create post record
        const postData = {
          user_id: user.id,
          content: description,
          game_id: selectedGame.id,
          game_name: selectedGame.name,
          video_url: postVideoUrl,
          clip_id: clipId, // Link to the clip if it exists
          images: imageUrls.length > 0 ? imageUrls : null,
          is_published: true,
          post_type: postDestination === 'clipts' ? 'clip' : 'regular'
        };
        
        // Create post in database
        const { data: post, error: postError } = await supabase
          .from('posts')
          .insert([postData])
          .select()
          .single();
          
        if (postError) {
          console.error('Failed to create post:', postError);
          toast.error(`Failed to create post: ${postError.message}`, { id: uploadToast });
          return;
        }
        
        // Clear cache to ensure latest posts appear immediately
        // No need to wait for this to complete
        try {
          console.log('Post created successfully, triggering cache refresh');
        } catch (e) {
          console.error('Error refreshing cache, but post was created:', e);
        }
        
        toast.success(`Post created and will appear in ${postDestination === 'clipts' ? 'Clipts' : 'Home Feed'}`, { id: uploadToast });
        
        // Navigate with refresh parameter to ensure latest posts are shown
        navigate(`/${postDestination === 'clipts' ? 'clipts' : ''}?refresh=${Date.now()}`);
      } catch (error) {
        console.error('Error creating post:', error);
        toast.error('Failed to create post. Please try again.');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post. Please try again.');
    }
  };

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800 text-white overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="stars-bg">
          <div className="stars-small"></div>
          <div className="stars-medium"></div>
          <div className="stars-large"></div>
        </div>
      </div>
      <motion.div 
        className="container max-w-md mx-auto p-4 pt-12 relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex items-center justify-between mb-4">
          <BackButton />
          <h1 className="text-xl font-bold">New Post</h1>
          <div className="w-8"></div> {/* Spacer for alignment */}
        </div>
        
        {/* Post Destination Tabs */}
        <div className="flex mb-6 bg-gray-800/50 p-1 rounded-lg">
          <button
            className={`flex-1 py-2 rounded-md ${postDestination === 'home' ? 'bg-purple-600 text-white' : 'text-gray-400'}`}
            onClick={() => !videoUrl && setPostDestination('home')}
            disabled={!!videoUrl} // Disable switching to home if we have a video from editor
          >
            Home Feed
          </button>
          <button
            className={`flex-1 py-2 rounded-md ${postDestination === 'clipts' ? 'bg-purple-600 text-white' : 'text-gray-400'}`}
            onClick={() => setPostDestination('clipts')}
          >
            Clipts
          </button>
        </div>
        
        <motion.div 
          className="p-6 bg-gray-900/80 backdrop-blur-sm rounded-lg border border-gray-800 shadow-xl relative overflow-hidden"
          variants={itemVariants}
        >
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-purple-800/10 via-blue-800/5 to-purple-800/10 pointer-events-none"
            variants={shimmerVariants}
            initial="hidden"
            animate="visible"
            style={{ backgroundSize: '200% 100%' }}
          ></motion.div>
          <motion.form 
            onSubmit={handleSubmit} 
            className="space-y-6 relative z-10"
            variants={containerVariants}
          >
            {/* Game Selection Field */}
            <div className="mb-4">
              <label className="block text-white font-medium mb-2">
                Select Game <span className="text-red-400">*</span>
              </label>
              <motion.div className="mb-2" variants={itemVariants}>
                <div className="relative">
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Input
                      type="text"
                      className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-400 pr-10"
                      placeholder="Search for a game..."
                      value={selectedGame ? selectedGame.name : gameSearch}
                      onChange={(e) => {
                        setSelectedGame(null);
                        handleGameSearch(e.target.value);
                      }}
                      onFocus={() => setShowGameSearch(true)}
                    />
                  </motion.div>
                  
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    {selectedGame ? (
                      <button
                        type="button"
                        className="text-gray-400 hover:text-white"
                        onClick={() => setSelectedGame(null)}
                      >
                        <X size={16} />
                      </button>
                    ) : (
                      <Search size={16} className="text-gray-400" />
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Search Results */}
              {showGameSearch && (
                <div className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
                  {gameSearchResults.length > 0 ? (
                    gameSearchResults.map((game) => (
                      <div
                        key={game.id}
                        className="p-2 hover:bg-gray-700 cursor-pointer flex items-center gap-2"
                        onClick={() => handleGameSelect(game)}
                      >
                        <Gamepad2 size={16} className="text-purple-400" />
                        <span>{game.name}</span>
                      </div>
                    ))
                  ) : (
                    gameSearch.trim() && (
                      <div className="p-2 text-center text-gray-400">
                        No games found matching "{gameSearch}"
                      </div>
                    )
                  )}
                </div>
              )}
              {postDestination === 'clipts' && (
                <p className="text-xs text-gray-400 mt-1">
                  <Video className="inline-block mr-1" size={14} />
                  Only video uploads are allowed for Clipts
                </p>
              )}
            </div>

            {/* Description Field */}
            <motion.div variants={itemVariants} className="space-y-2">
              <label className="block text-white font-medium mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-400" /> Caption
              </label>
              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <Textarea 
                  placeholder="Share your gaming moment..."
                  className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-400 min-h-[120px]"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </motion.div>
            </motion.div>
            
            {/* Media Preview */}
            {(mediaPreviewUrls.length > 0 || videoUrl) && (
              <motion.div 
                className="grid grid-cols-3 gap-2"
                variants={itemVariants}
              >
                {videoUrl ? (
                  <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden col-span-3">
                    <video 
                      src={videoUrl} 
                      className="w-full h-full object-cover"
                      controls
                    />
                    {/* No remove button for clips from editor */}
                  </div>
                ) : (
                  mediaPreviewUrls.map((url, index) => (
                    <div key={index} className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden">
                      {mediaFiles[index]?.type.startsWith('video/') ? (
                        <video 
                          src={url} 
                          className="w-full h-full object-cover"
                          controls
                        />
                      ) : (
                        <img 
                          src={url} 
                          alt={`Upload preview ${index+1}`}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <button 
                        type="button"
                        className="absolute top-1 right-1 bg-black/70 text-white p-1 rounded-full"
                        onClick={() => removeFile(index)}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))
                )}
                {!videoUrl && mediaPreviewUrls.length < 5 && (
                  <div 
                    className="aspect-video border-2 border-dashed border-gray-700 rounded-lg flex items-center justify-center cursor-pointer hover:border-purple-500/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </motion.div>
            )}
            
            {/* Media Upload Area */}
            {mediaPreviewUrls.length === 0 && !videoUrl && (
              <motion.div
                variants={itemVariants}
                whileHover={{ 
                  scale: 1.02, 
                  boxShadow: '0 0 15px rgba(168, 85, 247, 0.3)', 
                  borderColor: 'rgba(168, 85, 247, 0.5)' 
                }}
                whileTap={{ scale: 0.98 }} 
                className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center cursor-pointer hover:border-purple-500/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <motion.div
                  variants={pulseVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <Upload className="mx-auto h-12 w-12 text-purple-400" />
                </motion.div>
                <motion.p 
                  className="mt-2 text-sm text-gray-300"
                  animate={{ 
                    textShadow: ['0 0 0px rgba(168, 85, 247, 0)', '0 0 2px rgba(168, 85, 247, 0.5)', '0 0 0px rgba(168, 85, 247, 0)'] 
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  Drag and drop your media here, or click to browse
                </motion.p>
                <p className="mt-1 text-xs text-gray-500">
                  Supports: JPG, PNG, GIF, MP4, WEBM (max 50MB, up to 5 files)
                </p>
              </motion.div>
            )}
            
            <input 
              type="file" 
              ref={fileInputRef}
              className="hidden"
              accept="image/*,video/*"
              onChange={handleFileChange}
              multiple={postDestination === 'home'}
            />
            
            <motion.div variants={itemVariants} className="pt-4">
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Button 
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white relative overflow-hidden group font-medium"
                >
                  <motion.span 
                    className="relative z-10 flex items-center justify-center gap-2"
                    animate={{ textShadow: ['0 0 0px rgba(255,255,255,0.5)', '0 0 10px rgba(255,255,255,0.8)', '0 0 0px rgba(255,255,255,0.5)'] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sparkles className="h-4 w-4" />
                    Post Now
                  </motion.span>
                  <motion.span 
                    className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 opacity-0 group-hover:opacity-100" 
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  ></motion.span>
                </Button>
              </motion.div>
            </motion.div>
          </motion.form>
        </motion.div>
      </motion.div>
      
      {/* Add animated decorative elements */}
      <motion.div 
        className="fixed bottom-6 right-6 w-24 h-24 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: [0.2, 0.5, 0.2], 
          rotate: 360 
        }}
        transition={{ 
          duration: 20, 
          repeat: Infinity, 
          ease: "linear" 
        }}
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-500/10 via-blue-500/5 to-purple-500/10 blur-lg" />
      </motion.div>
      
      {/* Add another decorative element */}
      <motion.div 
        className="fixed top-20 left-10 w-32 h-32 pointer-events-none opacity-30"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ 
          opacity: 0.3, 
          scale: 1,
          rotate: -360 
        }}
        transition={{ 
          duration: 30, 
          repeat: Infinity, 
          ease: "linear" 
        }}
      >
        <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 border-t-purple-500/40" />
      </motion.div>
      
      {/* Add third decorative element */}
      <motion.div
        className="fixed bottom-20 left-10 w-24 h-24 pointer-events-none opacity-20"
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: [0.1, 0.3, 0.1], 
          rotate: 180 
        }}
        transition={{ 
          duration: 15, 
          repeat: Infinity, 
          ease: "linear" 
        }}
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500/10 via-purple-500/5 to-blue-500/10 blur-xl" />
      </motion.div>
    </motion.div>
  );
};

export default NewPost;
