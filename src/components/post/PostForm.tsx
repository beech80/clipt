import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Upload, Camera, Search, Hash, AtSign, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Progress } from '@/components/ui/progress';

type PostDestination = 'clipts' | 'home';

export const PostForm = () => {
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [filePreview, setFilePreview] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGame, setSelectedGame] = useState<{ id: string; name: string } | null>(null);
  const [gameSearch, setGameSearch] = useState('');
  const [streamRef, setStreamRef] = useState<MediaStream | null>(null);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [mentions, setMentions] = useState<string[]>([]);
  const [showHashtagInput, setShowHashtagInput] = useState(false);
  const [showMentionInput, setShowMentionInput] = useState(false);
  const [currentHashtag, setCurrentHashtag] = useState('');
  const [currentMention, setCurrentMention] = useState('');
  const [userResults, setUserResults] = useState<any[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [uploadProgress, setUploadProgress] = useState(0);

  const { data: games, isLoading: gamesLoading } = useQuery({
    queryKey: ['games', gameSearch],
    queryFn: async () => {
      if (!gameSearch) return [];

      const { data, error } = await supabase.functions.invoke('igdb', {
        body: {
          endpoint: 'games',
          query: `search "${gameSearch}"; fields name; limit 10;`
        }
      });

      if (error) throw error;
      return data.map((game: any) => ({
        id: game.id.toString(),
        name: game.name
      }));
    }
  });

  const addHashtag = () => {
    if (currentHashtag.trim() && !hashtags.includes(currentHashtag.trim())) {
      setHashtags([...hashtags, currentHashtag.trim()]);
      setCurrentHashtag('');
    }
    setShowHashtagInput(false);
  };

  const addMention = () => {
    if (currentMention.trim() && !mentions.includes(currentMention.trim())) {
      setMentions([...mentions, currentMention.trim()]);
      setCurrentMention('');
    }
    setShowMentionInput(false);
    setUserResults([]);
  };

  const removeHashtag = (tag: string) => {
    setHashtags(hashtags.filter(t => t !== tag));
  };

  const removeMention = (mention: string) => {
    setMentions(mentions.filter(m => m !== mention));
  };

  const handleGameSelect = (game: { id: string; name: string }) => {
    setSelectedGame(game);
    setGameSearch('');
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: true 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreamRef(stream);
        
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };
        
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'video/webm' });
          const file = new File([blob], 'recorded-video.webm', { type: 'video/webm' });
          setFiles([file]);
          const previewUrl = URL.createObjectURL(blob);
          setFilePreview([previewUrl]);
          chunksRef.current = [];
        };
      }
      toast.success('Camera started successfully');
    } catch (error) {
      toast.error('Unable to access camera');
      console.error('Camera error:', error);
    }
  };

  const stopCamera = () => {
    if (streamRef) {
      streamRef.getTracks().forEach(track => track.stop());
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setStreamRef(null);
      mediaRecorderRef.current = null;
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;
    
    const newFiles: File[] = [];
    const newPreviews: string[] = [];
    
    // Process each file
    Array.from(selectedFiles).forEach(selectedFile => {
      const isVideo = selectedFile.type.startsWith('video/');
      const isImage = selectedFile.type.startsWith('image/');
      
      if (!isVideo && !isImage) {
        toast.error('Please upload video or image files only');
        return;
      }
      
      if (selectedFile.size > 100 * 1024 * 1024) {
        toast.error('Each file must be less than 100MB');
        return;
      }
      
      // For videos, only allow one file
      if (isVideo && (newFiles.some(f => f.type.startsWith('video/')) || newFiles.length > 0)) {
        toast.error('Only one video can be uploaded at a time');
        return;
      }
      
      // For images, allow multiple (up to 5)
      if (isImage && newFiles.length >= 5) {
        toast.error('Maximum of 5 images allowed');
        return;
      }
      
      newFiles.push(selectedFile);
      newPreviews.push(URL.createObjectURL(selectedFile));
    });
    
    setFiles([...newFiles]);
    setFilePreview([...newPreviews]);
  };

  const handleCreatePost = async (destination: PostDestination) => {
    if (!user) {
      toast.error('Please sign in to create a post');
      return;
    }
    
    if (!content.trim()) {
      toast.error('Please add some content to your post');
      return;
    }

    if (!selectedGame) {
      toast.error('Please select a game for your post');
      return;
    }
    
    if (files.length === 0) {
      toast.error('Please upload at least one file');
      return;
    }

    setLoading(true);
    const uploadToast = toast.loading(
      destination === 'clipts' ? 'Creating your clip...' : 'Creating your post...'
    );

    try {
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .upsert({
          name: selectedGame.name,
          cover_url: selectedGame.id.toString()
        })
        .select()
        .single();

      if (gameError) {
        throw new Error(`Failed to process game: ${gameError.message}`);
      }

      // Upload files and get URLs
      const mediaUrls: { videoUrl: string | null, imageUrls: string[] } = {
        videoUrl: null,
        imageUrls: []
      };

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const timestamp = Date.now() + i; // Ensure unique timestamps
        const fileExt = file.name.split('.').pop();
        const filePath = `${user.id}/${timestamp}.${fileExt}`;

        console.log(`Starting file upload ${i+1}/${files.length}...`, {
          filePath,
          fileType: file.type,
          fileSize: file.size
        });

        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('media')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error(`Failed to upload file: ${uploadError.message}`);
        }

        console.log(`File ${i+1} uploaded successfully`, uploadData);

        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(filePath);

        if (file.type.startsWith('video/')) {
          mediaUrls.videoUrl = publicUrl;
        } else {
          mediaUrls.imageUrls.push(publicUrl);
        }
      }

      // Construct post data
      const postData = {
        content,
        user_id: user.id,
        game_id: gameData.id,
        post_type: destination,
        is_published: true,
        video_url: mediaUrls.videoUrl,
        // Store first image in image_url or concatenate multiple images with comma separation
        image_url: mediaUrls.imageUrls.length > 0 ? 
          (mediaUrls.imageUrls.length === 1 ? 
            mediaUrls.imageUrls[0] : 
            mediaUrls.imageUrls.join(',')
          ) : null
      };

      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert([postData])
        .select()
        .single();

      if (postError) {
        console.error('Post error:', postError);
        throw new Error(`Failed to create post: ${postError.message}`);
      }

      // Invalidate any existing posts queries to ensure fresh data
      await supabase.rpc('invalidate_cache', { cache_key: 'posts' });

      toast.success(
        destination === 'clipts' ? 'Clip created successfully!' : 'Post created successfully!'
      );
      
      stopCamera();
      setContent('');
      setFiles([]);
      setFilePreview([]);
      setSelectedGame(null);
      setHashtags([]);
      setMentions([]);
      setUploadProgress(0);
      
      if (destination === 'clipts') {
        // Add timestamp to force refresh of the page
        navigate(`/clipts?refresh=${Date.now()}`);
      } else {
        // Add timestamp to force refresh of the homepage
        navigate(`/?refresh=${Date.now()}`);
      }
      
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to create post. Please try again.',
        { id: uploadToast }
      );
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const searchUsers = async (query: string) => {
    if (!query || query.length < 2) {
      setUserResults([]);
      return;
    }
    
    setSearchingUsers(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .ilike('username', `%${query}%`)
        .limit(5);
        
      if (error) throw error;
      
      setUserResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearchingUsers(false);
    }
  };

  const handleUserSelect = (username: string) => {
    if (!mentions.includes(username)) {
      setMentions([...mentions, username]);
    }
    setCurrentMention('');
    setUserResults([]);
    setShowMentionInput(false);
  };

  return (
    <div className="relative min-h-screen bg-gaming-900">
      <div className="space-y-6 max-w-2xl mx-auto p-6 pb-48">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Search for a game..."
              value={gameSearch}
              onChange={(e) => setGameSearch(e.target.value)}
              className="pl-10"
            />
            
            {gameSearch && !gamesLoading && (
              <div className="absolute z-10 w-full mt-1 bg-gaming-800 rounded-md shadow-lg border border-gaming-700">
                {!games || games.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-400">
                    No games found
                  </div>
                ) : (
                  <div className="max-h-60 overflow-auto">
                    {games.map((game) => (
                      <button
                        key={game.id}
                        onClick={() => handleGameSelect(game)}
                        className="w-full px-4 py-2 text-left hover:bg-gaming-700 text-white text-sm"
                      >
                        {game.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {selectedGame && (
              <div className="mt-2 p-2 bg-gaming-800 rounded-md flex items-center justify-between">
                <span className="text-white">{selectedGame.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedGame(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              className="min-h-[100px]"
            />

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowHashtagInput(true)}
                className="flex items-center gap-2"
              >
                <Hash className="w-4 h-4" />
                Add Hashtag
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowMentionInput(true)}
                className="flex items-center gap-2"
              >
                <AtSign className="w-4 h-4" />
                Mention User
              </Button>
            </div>

            {showHashtagInput && (
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={currentHashtag}
                  onChange={(e) => setCurrentHashtag(e.target.value)}
                  placeholder="Enter hashtag"
                  className="flex-1"
                />
                <Button onClick={addHashtag}>Add</Button>
                <Button variant="ghost" onClick={() => setShowHashtagInput(false)}>Cancel</Button>
              </div>
            )}

            {showMentionInput && (
              <div className="relative mt-2">
                <div className="flex items-center">
                  <AtSign className="w-5 h-5 text-gray-400 absolute left-3" />
                  <Input
                    value={currentMention}
                    onChange={(e) => {
                      setCurrentMention(e.target.value);
                      searchUsers(e.target.value);
                    }}
                    placeholder="Mention a user"
                    className="pl-10 pr-16"
                    autoFocus
                  />
                  <Button 
                    onClick={addMention} 
                    size="sm" 
                    className="absolute right-1"
                  >
                    Add
                  </Button>
                </div>
                
                {/* User search results */}
                {userResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg max-h-60 overflow-auto">
                    {userResults.map(user => (
                      <div 
                        key={user.id}
                        onClick={() => handleUserSelect(user.username)}
                        className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                              {user.username.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{user.display_name || user.username}</div>
                          <div className="text-xs text-gray-500">@{user.username}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {searchingUsers && (
                  <div className="flex justify-center items-center p-4">
                    <Loader2 className="animate-spin h-5 w-5 text-gray-400" />
                  </div>
                )}
              </div>
            )}

            {hashtags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {hashtags.map(tag => (
                  <div key={tag} className="bg-gaming-800 px-2 py-1 rounded-full flex items-center gap-2">
                    <span>#{tag}</span>
                    <button onClick={() => removeHashtag(tag)} className="text-gray-400 hover:text-white">×</button>
                  </div>
                ))}
              </div>
            )}

            {mentions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {mentions.map(mention => (
                  <div key={mention} className="bg-gaming-800 px-2 py-1 rounded-full flex items-center gap-2">
                    <span>@{mention}</span>
                    <button onClick={() => removeMention(mention)} className="text-gray-400 hover:text-white">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={startCamera}
                  className="flex items-center justify-center gap-2 h-12"
                >
                  <Camera className="w-5 h-5" />
                  Open Camera
                </Button>
              </div>

              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-900/50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-4 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-400">
                      <span className="font-semibold">Upload from device</span>
                    </p>
                    <p className="text-xs text-gray-400">Supports video and images (max 100MB)</p>
                    <p className="text-xs text-purple-400 mt-1">Now you can post both videos and images to Clipts!</p>
                    <p className="text-xs text-green-400 mt-1">Select multiple images to create a photo collage!</p>
                  </div>
                  <Input
                    type="file"
                    className="hidden"
                    accept="video/*,image/*"
                    onChange={handleFileChange}
                    multiple
                  />
                </label>
              </div>
            </div>

            {videoRef.current && (
              <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                <video
                  ref={videoRef}
                  className="w-full h-full object-contain"
                  autoPlay
                  playsInline
                  muted
                />
              </div>
            )}

            {filePreview.length > 0 && (
              <div className={`relative ${filePreview.length > 1 ? 'grid grid-cols-2 gap-2' : ''}`}>
                {filePreview.map((preview, index) => (
                  <div key={index} className="aspect-video rounded-lg overflow-hidden bg-black">
                    {files[index]?.type.startsWith('video/') ? (
                      <video
                        src={preview}
                        className="w-full h-full object-contain"
                        controls
                      />
                    ) : (
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-contain"
                      />
                    )}
                    <button 
                      className="absolute top-2 right-2 bg-gray-800 rounded-full p-1"
                      onClick={() => {
                        setFiles(files.filter((_, i) => i !== index));
                        setFilePreview(filePreview.filter((_, i) => i !== index));
                      }}
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="space-y-2">
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-sm text-center text-gray-400">
                  Uploading... {Math.round(uploadProgress)}%
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="sticky bottom-0 bg-gray-950 py-4 mt-auto">
        <div className="flex gap-4">
          <Button
            type="button"
            variant="default"
            onClick={() => handleCreatePost('clipts')}
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Clipt...
              </>
            ) : (
              'Post to Clipts'
            )}
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={() => handleCreatePost('home')}
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Post...
              </>
            ) : (
              'Post to Home'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PostForm;
