import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Upload, Camera, Search, Hash, AtSign, X, Film, Home, Gamepad2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { allGames } from '@/data/gamesList';

type PostDestination = 'clipts' | 'home';

export const PostForm = () => {
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [filePreview, setFilePreview] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGame, setSelectedGame] = useState<{ id: string; name: string } | null>(null);
  const [gameSearch, setGameSearch] = useState('');
  const [gameSearchResults, setGameSearchResults] = useState<typeof allGames>([]);
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

  const handleGameSearch = (searchTerm: string) => {
    setGameSearch(searchTerm);
    
    if (!searchTerm.trim()) {
      setGameSearchResults([]);
      return;
    }
    
    const searchTermLower = searchTerm.toLowerCase();
    
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
    
    const combinedResults = [...exactMatches, ...startsWithMatches, ...containsMatches].slice(0, 10);
    
    setGameSearchResults(combinedResults);
  };

  const handleGameSelect = (game: { id: string; name: string }) => {
    setSelectedGame(game);
    setGameSearch('');
    setGameSearchResults([]);
  };

  const renderGameSearchSection = () => {
    return (
      <div className="mb-4 bg-gaming-800 border border-gray-700 rounded-lg p-3">
        <h3 className="text-lg font-semibold mb-2 text-white flex items-center">
          <Gamepad2 className="mr-2 h-5 w-5 text-blue-400" />
          Select Game <span className="text-red-400 ml-1">*</span>
        </h3>
        
        {selectedGame ? (
          <div className="flex items-center justify-between bg-gaming-700 p-2 rounded mb-2">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gaming-600 rounded flex items-center justify-center">
                <Gamepad2 className="h-4 w-4 text-blue-400" />
              </div>
              <span className="ml-2 text-white">{selectedGame.name}</span>
            </div>
            <button 
              onClick={() => setSelectedGame(null)} 
              className="text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="relative mb-2">
            <div className="flex items-center">
              <input
                type="text"
                placeholder="Search for a game..."
                value={gameSearch}
                onChange={(e) => handleGameSearch(e.target.value)}
                className="w-full px-4 py-2 bg-gaming-700 text-white border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute right-3 h-5 w-5 text-gray-400" />
            </div>
            
            {gameSearch.length > 0 && gameSearchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-gaming-700 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                <div className="divide-y divide-gray-700">
                  {gameSearchResults.map((game) => (
                    <div
                      key={game.id}
                      onClick={() => handleGameSelect(game)}
                      className="p-2 hover:bg-gaming-600 cursor-pointer"
                    >
                      <span className="text-white">{game.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <p className="text-xs text-red-400 mt-1">
              You must select a game for your post. This helps categorize your content.
            </p>
          </div>
        )}
      </div>
    );
  };

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
      
      if (isVideo && (newFiles.some(f => f.type.startsWith('video/')) || newFiles.length > 0)) {
        toast.error('Only one video can be uploaded at a time');
        return;
      }
      
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

  const handleSubmit = async (destination: PostDestination = 'clipts') => {
    if (!user) {
      toast.error('You must be logged in to post');
      return;
    }
    
    if (!selectedGame) {
      toast.error('You must select a game for your post');
      return;
    }

    if (!content.trim() && files.length === 0) {
      toast.error('Post must contain text or media');
      return;
    }
    
    try {
      setLoading(true);
      
      let fileUrls: string[] = [];
      
      if (files.length > 0) {
        fileUrls = await Promise.all(
          files.map(async (file, index) => {
            const fileExt = file.name.split('.').pop();
            const filePath = `${user.id}/${Date.now()}-${index}.${fileExt}`;
            
            const { error: uploadError, data } = await supabase.storage
              .from('posts')
              .upload(filePath, file, {
                upsert: true,
                onUploadProgress: (progress) => {
                  setUploadProgress(Math.round((progress.loaded / progress.total) * 100));
                }
              });
              
            if (uploadError) {
              throw uploadError;
            }
            
            const { data: { publicUrl } } = supabase.storage
              .from('posts')
              .getPublicUrl(filePath);
              
            return publicUrl;
          })
        );
      }
      
      const { error: postError, data: postData } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content,
          media_urls: fileUrls,
          hashtags,
          mentions,
          game_id: selectedGame.id,  
          game_name: selectedGame.name, 
          post_type: destination === 'home' ? 'home' : 'clip',
        })
        .select()
        .single();
        
      if (postError) throw postError;
      
      setContent('');
      setFiles([]);
      setFilePreview([]);
      setSelectedGame(null);
      setHashtags([]);
      setMentions([]);
      
      toast.success('Post created successfully!');
      
      if (postData) {
        navigate(`/post/${postData.id}`);
      }
      
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast.error(`Error: ${error.message || 'Failed to create post'}`);
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
        {renderGameSearchSection()}
        <div className="space-y-4">
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
                  <p className="text-xs text-gray-400">
                    Supports video and images (max 100MB)
                  </p>
                  <p className="text-xs text-purple-400 mt-1">
                    Now you can post both videos and images to Clipts!
                  </p>
                  <p className="text-xs text-green-400 mt-1">
                    Select multiple images to create a photo collage!
                  </p>
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
      <div className="sticky bottom-0 bg-gray-950 py-4 mt-auto border-t border-gray-800 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row gap-4 px-2">
          <Button
            type="button"
            variant="default"
            onClick={() => handleSubmit('clipts')}
            disabled={loading}
            className="flex-1 relative overflow-hidden group border-2 border-indigo-500 bg-gradient-to-r from-violet-600/80 to-indigo-700/80 text-white font-gaming py-3 px-6 rounded-md shadow-[0_0_15px_rgba(99,102,241,0.5)] transform transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(124,58,237,0.6)] before:absolute before:inset-0 before:bg-gradient-to-r before:from-indigo-500/20 before:to-purple-600/20 before:opacity-0 before:transition-opacity hover:before:opacity-100"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                <span className="text-base">Creating Clipt...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <div className="relative mr-3 w-6 h-6 bg-indigo-900/50 rounded-md flex items-center justify-center border border-indigo-400/30 shadow-inner">
                  <Film className="h-4 w-4 text-indigo-200 group-hover:text-white transition-colors duration-300" />
                </div>
                <span className="text-base tracking-wide group-hover:tracking-wider transition-all duration-300 relative">
                  POST TO CLIPTS
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-transparent via-purple-300 to-transparent group-hover:w-full transition-all duration-300"></span>
                </span>
              </div>
            )}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleSubmit('home')}
            disabled={loading}
            className="flex-1 relative overflow-hidden group border-2 border-cyan-500 bg-gradient-to-r from-blue-600/80 to-cyan-700/80 text-white font-gaming py-3 px-6 rounded-md shadow-[0_0_15px_rgba(6,182,212,0.5)] transform transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(14,165,233,0.6)] before:absolute before:inset-0 before:bg-gradient-to-r before:from-cyan-500/20 before:to-blue-600/20 before:opacity-0 before:transition-opacity hover:before:opacity-100"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                <span className="text-base">Creating Post...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <div className="relative mr-3 w-6 h-6 bg-blue-900/50 rounded-md flex items-center justify-center border border-blue-400/30 shadow-inner">
                  <Home className="h-4 w-4 text-blue-200 group-hover:text-white transition-colors duration-300" />
                </div>
                <span className="text-base tracking-wide group-hover:tracking-wider transition-all duration-300 relative">
                  POST TO HOME
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-300 to-transparent group-hover:w-full transition-all duration-300"></span>
                </span>
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PostForm;
