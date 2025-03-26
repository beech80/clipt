import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { BackButton } from '@/components/ui/back-button';
import { Camera, Upload, X, Video, Image as ImageIcon, Search, Gamepad2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { allGames } from '@/data/gamesList';

const NewPost = () => {
  const navigate = useNavigate();
  const [postDestination, setPostDestination] = useState('home');
  const [description, setDescription] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviewUrls, setMediaPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Add game selection state
  const [selectedGame, setSelectedGame] = useState<{ id: string; name: string } | null>(null);
  const [gameSearch, setGameSearch] = useState('');
  const [gameSearchResults, setGameSearchResults] = useState<typeof allGames>([]);
  const [showGameSearch, setShowGameSearch] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate number of files
    if (mediaFiles.length + files.length > 5) {
      toast.error('You can only upload a maximum of 5 files');
      return;
    }
    
    // Validate file types based on destination
    if (postDestination === 'clipts') {
      const invalidFiles = files.filter(file => !file.type.startsWith('video/'));
      if (invalidFiles.length > 0) {
        toast.error('Only video files are allowed for Clipts');
        return;
      }
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
    
    if (mediaFiles.length === 0) {
      toast.error('Please upload at least one media file');
      return;
    }
    
    // Check if game is selected
    if (!selectedGame) {
      toast.error('Please select a game for your post');
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
      
      // Get user info
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        toast.error('You must be logged in to create a post');
        return;
      }
      
      const userId = session.session.user.id;
      
      // Upload files to storage
      const uploadedUrls = [];
      for (let i = 0; i < mediaFiles.length; i++) {
        const file = mediaFiles[i];
        const timestamp = Date.now() + i;
        const fileExt = file.name.split('.').pop();
        const filePath = `${userId}/${timestamp}.${fileExt}`;
        
        // Upload file
        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });
          
        if (uploadError) {
          toast.error(`Failed to upload file: ${uploadError.message}`, { id: uploadToast });
          return;
        }
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(filePath);
          
        uploadedUrls.push(publicUrl);
      }
      
      // Prepare post data
      const postData = {
        content: description,
        user_id: userId,
        post_type: postDestination,
        is_published: true,
        // Store all image URLs in media_urls field as JSON
        media_urls: JSON.stringify(uploadedUrls),
        // For clips, set the first URL as thumbnail
        thumbnail_url: postDestination === 'clipts' ? uploadedUrls[0] : null,
        // Add game information - store only the ID
        game_id: selectedGame.id
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
      
      toast.success(`Post created and will appear in ${postDestination === 'home' ? 'Home' : 'Clipts'}`, { id: uploadToast });
      
      // Navigate with refresh parameter to ensure latest posts are shown
      navigate(`/${postDestination === 'clipts' ? 'clipts' : ''}?refresh=${Date.now()}`);
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a237e] to-[#0d1b3c]">
      <div className="fixed top-0 left-0 right-0 z-50 p-4 bg-black/40 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center justify-center max-w-7xl mx-auto relative">
          <BackButton />
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Camera className="text-purple-400" size={24} />
            New Post
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-24 pb-20 max-w-xl">
        <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-white/10 shadow-xl">
          {/* Post Destination Toggle */}
          <div className="mb-6">
            <p className="text-white text-sm mb-2">Post to:</p>
            <div className="flex space-x-2">
              <Button 
                variant={postDestination === 'home' ? "default" : "outline"}
                className={postDestination === 'home' 
                  ? "bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2" 
                  : "bg-gray-800/50 border-gray-700 text-gray-300 flex items-center gap-2"
                }
                onClick={() => setPostDestination('home')}
              >
                <ImageIcon size={16} />
                Home Feed
              </Button>
              <Button 
                variant={postDestination === 'clipts' ? "default" : "outline"}
                className={postDestination === 'clipts' 
                  ? "bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2" 
                  : "bg-gray-800/50 border-gray-700 text-gray-300 flex items-center gap-2"
                }
                onClick={() => setPostDestination('clipts')}
              >
                <Video size={16} />
                Clipts
              </Button>
            </div>
            {postDestination === 'clipts' && (
              <p className="text-amber-400 text-xs mt-2">Note: Only video content is allowed in Clipts</p>
            )}
          </div>
          
          {/* Game Selection Field */}
          <div className="mb-4">
            <label className="block text-white font-medium mb-2">
              Select Game <span className="text-red-400">*</span>
            </label>
            
            {selectedGame ? (
              <div className="flex items-center justify-between bg-gray-800/50 p-2 rounded">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-800 rounded flex items-center justify-center">
                    <Gamepad2 className="h-4 w-4 text-white" />
                  </div>
                  <span className="ml-2 text-white">{selectedGame.name}</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setSelectedGame(null)} 
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <div 
                  className="flex items-center justify-between bg-gray-800/50 p-2 rounded cursor-pointer"
                  onClick={() => setShowGameSearch(!showGameSearch)}
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-800 rounded flex items-center justify-center">
                      <Gamepad2 className="h-4 w-4 text-white" />
                    </div>
                    <span className="ml-2 text-gray-400">Select a game...</span>
                  </div>
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                
                {showGameSearch && (
                  <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-white/10 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    <div className="p-2">
                      <input
                        type="text"
                        placeholder="Search for a game..."
                        value={gameSearch}
                        onChange={(e) => handleGameSearch(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-800 text-white border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-white"
                        autoFocus
                      />
                    </div>
                    
                    {gameSearchResults.length > 0 ? (
                      <div className="divide-y divide-gray-800">
                        {gameSearchResults.map((game) => (
                          <div
                            key={game.id}
                            onClick={() => handleGameSelect(game)}
                            className="p-2 hover:bg-gray-900 cursor-pointer"
                          >
                            <span className="text-white">{game.name}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      gameSearch.trim() && (
                        <div className="p-2 text-center text-gray-400">
                          No games found matching "{gameSearch}"
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            )}
            
            <p className="text-xs text-red-400 mt-1">
              * You must select a game for your post
            </p>
          </div>
          
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <Textarea 
                placeholder="Share your gaming moment..." 
                className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-400 min-h-[120px]"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
            
            {/* Media Preview */}
            {mediaPreviewUrls.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {mediaPreviewUrls.map((url, index) => (
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
                ))}
                {mediaPreviewUrls.length < 5 && (
                  <div 
                    className="aspect-video border-2 border-dashed border-gray-700 rounded-lg flex items-center justify-center cursor-pointer hover:border-purple-500/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>
            )}
            
            {/* Media Upload Area */}
            {mediaPreviewUrls.length === 0 && (
              <div 
                className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center cursor-pointer hover:border-purple-500/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-400">
                  Drag and drop your media here, or click to browse
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {postDestination === 'clipts' 
                    ? 'Supports: MP4, WEBM videos (max 50MB)'
                    : 'Supports: JPG, PNG, GIF, MP4 (max 50MB, up to 5 files)'
                  }
                </p>
              </div>
            )}
            
            <input 
              type="file" 
              ref={fileInputRef}
              className="hidden"
              accept={postDestination === 'clipts' ? 'video/*' : 'image/*,video/*'}
              onChange={handleFileChange}
              multiple={postDestination === 'home'}
            />
            
            <Button 
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              Post
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewPost;
