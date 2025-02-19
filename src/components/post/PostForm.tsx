
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Upload, Camera } from 'lucide-react';

export const PostForm = () => {
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: true 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
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
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Create preview URL
      const previewUrl = URL.createObjectURL(selectedFile);
      setFilePreview(previewUrl);

      // If it's an image, scan it for inappropriate content
      if (selectedFile.type.startsWith('image/')) {
        try {
          const formData = new FormData();
          formData.append('file', selectedFile);
          
          const response = await fetch('/functions/scan-media-content', {
            method: 'POST',
            body: JSON.stringify({ imageUrl: previewUrl }),
            headers: {
              'Content-Type': 'application/json',
            },
          });

          const result = await response.json();
          
          if (!result.safe) {
            setFile(null);
            setFilePreview(null);
            toast.error('This content violates our community guidelines');
            return;
          }
        } catch (error) {
          console.error('Content moderation error:', error);
          toast.error('Unable to verify content safety');
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      let fileUrl = null;

      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        // Upload file
        const { error: uploadError, data } = await supabase.storage
          .from('posts')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('posts')
          .getPublicUrl(filePath);

        fileUrl = publicUrl;
      }

      // Create post
      const { error: postError } = await supabase
        .from('posts')
        .insert({
          content,
          user_id: user.id,
          ...(file?.type.startsWith('video/') 
            ? { video_url: fileUrl }
            : { image_url: fileUrl }
          ),
          is_published: true
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
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto p-6">
      <div className="space-y-4">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          className="min-h-[100px]"
        />

        <div className="grid gap-4">
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-900/50 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-4 text-gray-400" />
                <p className="mb-2 text-sm text-gray-400">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-400">Video or Image (max. 100MB)</p>
              </div>
              <Input
                type="file"
                className="hidden"
                accept="video/*,image/*"
                onChange={handleFileChange}
                capture="environment"
              />
            </label>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={startCamera}
            className="flex items-center gap-2"
          >
            <Camera className="w-4 h-4" />
            Use Camera
          </Button>

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
        className="w-full"
        disabled={loading || !content}
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
  );
};
