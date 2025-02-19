
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Upload, Camera, Hash, AtSign } from 'lucide-react';
import GameBoyControls from '@/components/GameBoyControls';

export const PostForm = () => {
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [mentions, setMentions] = useState<string[]>([]);
  const [showHashtagInput, setShowHashtagInput] = useState(false);
  const [showMentionInput, setShowMentionInput] = useState(false);
  const [currentHashtag, setCurrentHashtag] = useState('');
  const [currentMention, setCurrentMention] = useState('');

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: true 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
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
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      streamRef.current = null;
      mediaRecorderRef.current = null;
    }
  };

  const startRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive') {
      mediaRecorderRef.current.start();
      toast.success('Recording started');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      stopCamera();
      toast.success('Recording completed');
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 100 * 1024 * 1024) { // 100MB limit
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

  const addHashtag = () => {
    if (currentHashtag.trim()) {
      setHashtags([...hashtags, currentHashtag.trim()]);
      setCurrentHashtag('');
      setShowHashtagInput(false);
      toast.success('Hashtag added');
    }
  };

  const addMention = () => {
    if (currentMention.trim()) {
      setMentions([...mentions, currentMention.trim()]);
      setCurrentMention('');
      setShowMentionInput(false);
      toast.success('Mention added');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to create a post');
      return;
    }
    
    if (!content.trim()) {
      toast.error('Please add some content to your post');
      return;
    }
    
    setLoading(true);
    try {
      let fileUrl = null;

      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('posts')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('posts')
          .getPublicUrl(filePath);

        fileUrl = publicUrl;
      }

      const { error: postError } = await supabase
        .from('posts')
        .insert({
          content,
          user_id: user.id,
          ...(file?.type.startsWith('video/') 
            ? { video_url: fileUrl }
            : { image_url: fileUrl }
          ),
          is_published: true,
          hashtags,
          mentions
        });

      if (postError) throw postError;

      toast.success('Post created successfully!');
      navigate('/');
    } catch (error) {
      toast.error('Error creating post');
      console.error('Error:', error);
    } finally {
      setLoading(false);
      stopCamera();
    }
  };

  return (
    <div className="relative min-h-screen bg-gaming-900 pb-[200px]">
      <div className="max-w-2xl mx-auto p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                className="min-h-[100px] bg-gaming-800/50 border-gaming-400/30 text-white placeholder:text-gaming-400/50"
              />
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowHashtagInput(true)}
                  className="flex items-center gap-2"
                >
                  <Hash className="w-4 h-4" />
                  Add Hashtag
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowMentionInput(true)}
                  className="flex items-center gap-2"
                >
                  <AtSign className="w-4 h-4" />
                  Mention Someone
                </Button>
              </div>

              {showHashtagInput && (
                <div className="flex gap-2">
                  <Input
                    value={currentHashtag}
                    onChange={(e) => setCurrentHashtag(e.target.value)}
                    placeholder="Enter hashtag"
                    className="flex-1 bg-gaming-800/50 border-gaming-400/30"
                  />
                  <Button onClick={() => {
                    if (currentHashtag.trim()) {
                      setHashtags([...hashtags, currentHashtag.trim()]);
                      setCurrentHashtag('');
                      setShowHashtagInput(false);
                      toast.success('Hashtag added');
                    }
                  }}>Add</Button>
                </div>
              )}

              {showMentionInput && (
                <div className="flex gap-2">
                  <Input
                    value={currentMention}
                    onChange={(e) => setCurrentMention(e.target.value)}
                    placeholder="@username"
                    className="flex-1 bg-gaming-800/50 border-gaming-400/30"
                  />
                  <Button onClick={() => {
                    if (currentMention.trim()) {
                      setMentions([...mentions, currentMention.trim()]);
                      setCurrentMention('');
                      setShowMentionInput(false);
                      toast.success('Mention added');
                    }
                  }}>Add</Button>
                </div>
              )}

              {(hashtags.length > 0 || mentions.length > 0) && (
                <div className="flex flex-wrap gap-2">
                  {hashtags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 rounded bg-gaming-800 text-gaming-400">
                      #{tag}
                    </span>
                  ))}
                  {mentions.map((mention, index) => (
                    <span key={index} className="px-2 py-1 rounded bg-gaming-800 text-gaming-400">
                      @{mention}
                    </span>
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
                    className="flex items-center justify-center gap-2 h-12 bg-gaming-800/50 border-gaming-400/30"
                  >
                    <Camera className="w-5 h-5" />
                    Open Camera
                  </Button>
                  
                  {streamRef.current && (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="default"
                        onClick={startRecording}
                        className="flex-1"
                      >
                        Start Recording
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={stopRecording}
                        className="flex-1"
                      >
                        Stop Recording
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gaming-800/50 transition-colors border-gaming-400/30">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-4 text-gaming-400" />
                      <p className="mb-2 text-sm text-gaming-400">
                        <span className="font-semibold">Upload from device</span>
                      </p>
                      <p className="text-xs text-gaming-400">Supports video and images (max 100MB)</p>
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
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-gaming-400/20 hover:bg-gaming-400/30"
            disabled={loading || !content.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Post...
              </>
            ) : (
              'Create Post'
            )}
          </Button>
        </form>
      </div>

      <GameBoyControls />
    </div>
  );
};
