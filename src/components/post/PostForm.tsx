import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Upload, Camera, Search, Hash, AtSign } from 'lucide-react';
import GameBoyControls from '@/components/GameBoyControls';
import { useQuery } from '@tanstack/react-query';

type PostDestination = 'clipts' | 'home';

export const PostForm = () => {
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [selectedGame, setSelectedGame] = useState<{ id: string; name: string } | null>(null);
  const [gameSearch, setGameSearch] = useState('');
  const [streamRef, setStreamRef] = useState<MediaStream | null>(null);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [mentions, setMentions] = useState<string[]>([]);
  const [showHashtagInput, setShowHashtagInput] = useState(false);
  const [showMentionInput, setShowMentionInput] = useState(false);
  const [currentHashtag, setCurrentHashtag] = useState('');
  const [currentMention, setCurrentMention] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const navigate = useNavigate();
  const { user } = useAuth();

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
          setFile(file);
          const previewUrl = URL.createObjectURL(blob);
          setFilePreview(previewUrl);
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
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      const isVideo = selectedFile.type.startsWith('video/');
      const isImage = selectedFile.type.startsWith('image/');

      if (!isVideo && !isImage) {
        toast.error('Please upload a video or image file');
        return;
      }

      if (selectedFile.size > 100 * 1024 * 1024) {
        toast.error('File size must be less than 100MB');
        return;
      }

      setFile(selectedFile);
      const previewUrl = URL.createObjectURL(selectedFile);
      setFilePreview(previewUrl);
      stopCamera();
      toast.success('File selected successfully');
    }
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
    
    if (!file) {
      toast.error('Please upload a file');
      return;
    }

    const isVideo = file.type.startsWith('video/');

    if (destination === 'clipts' && !isVideo) {
      toast.error('Only video clips are allowed in Clipts');
      return;
    }

    setLoading(true);

    try {
      const postData = {
        content,
        user_id: user.id,
        game_id: selectedGame.id,
        post_type: destination,
        is_published: true
      };

      const { data: newPost, error: postError } = await supabase
        .from('posts')
        .insert([postData])
        .select()
        .single();

      if (postError) {
        console.error('Post error:', postError);
        throw new Error(`Failed to create post: ${postError.message}`);
      }

      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${timestamp}.${fileExt}`;

      console.log('Starting file upload...', {
        filePath,
        fileType: file.type,
        fileSize: file.size
      });

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        await supabase.from('posts').delete().eq('id', newPost.id);
        console.error('Upload error:', uploadError);
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }

      console.log('File uploaded successfully', uploadData);

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      console.log('File URL:', publicUrl);

      const { error: updateError } = await supabase
        .from('posts')
        .update({
          video_url: isVideo ? publicUrl : null,
          image_url: !isVideo ? publicUrl : null,
        })
        .eq('id', newPost.id);

      if (updateError) {
        console.error('Update error:', updateError);
        throw new Error(`Failed to update post with media: ${updateError.message}`);
      }

      toast.success(destination === 'clipts' ? 'Clipt created successfully!' : 'Post created successfully!');
      
      stopCamera();
      setContent('');
      setFile(null);
      setFilePreview(null);
      setSelectedGame(null);
      setHashtags([]);
      setMentions([]);
      
      navigate(destination === 'clipts' ? '/clipts' : '/');
      
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
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
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={currentMention}
                  onChange={(e) => setCurrentMention(e.target.value)}
                  placeholder="Enter username"
                  className="flex-1"
                />
                <Button onClick={addMention}>Add</Button>
                <Button variant="ghost" onClick={() => setShowMentionInput(false)}>Cancel</Button>
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
                  </div>
                  <Input
                    type="file"
                    className="hidden"
                    accept="video/*,image/*"
                    onChange={handleFileChange}
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

            {filePreview && (
              <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                {file?.type.startsWith('video/') ? (
                  <video
                    src={filePreview}
                    className="w-full h-full object-contain"
                    controls
                  />
                ) : (
                  <img
                    src={filePreview}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
            )}

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
      </div>
      <GameBoyControls />
    </div>
  );
};
