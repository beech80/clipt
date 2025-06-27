import React, { useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { cloudflareStreamService } from '@/services/cloudflareStreamService';
import { Upload, Video, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import { Progress } from './ui/progress';
import { supabase } from '@/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

interface StreamUploaderProps {
  onSuccess?: (videoId: string) => void;
  maxSize?: number; // in MB
  allowedTypes?: string[];
  className?: string;
  redirectAfterUpload?: boolean;
  customRedirectPath?: string;
}

const StreamUploader: React.FC<StreamUploaderProps> = ({
  onSuccess,
  maxSize = 500, // Default 500MB max
  allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'],
  className = '',
  redirectAfterUpload = false,
  customRedirectPath
}) => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedVideoId, setUploadedVideoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setError(null);
    
    if (!selectedFile) {
      return;
    }
    
    // Check file type
    if (!allowedTypes.includes(selectedFile.type)) {
      setError(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
      return;
    }
    
    // Check file size
    const fileSizeMB = selectedFile.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      setError(`File too large. Maximum size: ${maxSize}MB`);
      return;
    }
    
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    if (!title.trim()) {
      setError('Please provide a title for your stream');
      return;
    }

    if (!user) {
      toast.error('You must be logged in to upload streams');
      return;
    }

    setUploading(true);
    setError(null);
    
    try {
      // Get direct upload URL from Cloudflare
      const uploadResult = await cloudflareStreamService.createDirectUpload();
      
      if (!uploadResult.success || !uploadResult.data) {
        throw new Error(uploadResult.error || 'Failed to create upload URL');
      }
      
      const { uploadUrl, id: videoId } = uploadResult.data;
      
      // Prepare form data for upload
      const formData = new FormData();
      formData.append('file', file);
      
      // Upload file with progress tracking
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setProgress(percentComplete);
        }
      });
      
      xhr.addEventListener('load', async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploadedVideoId(videoId);
          
          // Wait a moment to ensure Cloudflare has processed the video
          setTimeout(async () => {
            // Save video metadata to your database
            const { error: dbError } = await supabase
              .from('streams')
              .insert({
                title,
                description,
                user_id: user.id,
                thumbnail_url: cloudflareStreamService.getThumbnailUrl(videoId),
                stream_url: cloudflareStreamService.getStreamUrl(videoId),
                hls_playback_url: cloudflareStreamService.getStreamUrl(videoId),
                playback_url: `${import.meta.env.VITE_CLOUDFLARE_STREAM_URL}/${videoId}`,
                cdn_url: `${import.meta.env.VITE_CLOUDFLARE_STREAM_URL}/${videoId}`,
                is_live: false,
                vod_enabled: true,
                vod_processing_status: 'completed',
                health_status: 'healthy',
                stream_health_status: 'healthy',
                chat_enabled: false,
                dvr_enabled: false,
                stream_settings: { videoId, provider: 'cloudflare' },
                abr_active: true,
                low_latency_active: false
              });
            
            if (dbError) {
              console.error('Error saving stream metadata:', dbError);
              toast.error('Video uploaded but failed to save metadata');
            } else {
              toast.success('Stream uploaded successfully!');
              
              // Call the success callback if provided
              if (onSuccess) {
                onSuccess(videoId);
              }
              
              // Redirect if specified
              if (redirectAfterUpload) {
                navigate(customRedirectPath || `/stream/${videoId}`);
              }
            }
            
            setUploading(false);
          }, 2000);
        } else {
          setError('Upload failed');
          setUploading(false);
          console.error('Upload error:', xhr.responseText);
        }
      });
      
      xhr.addEventListener('error', () => {
        setError('Network error during upload');
        setUploading(false);
      });
      
      xhr.addEventListener('abort', () => {
        setError('Upload was aborted');
        setUploading(false);
      });
      
      xhr.open('POST', uploadUrl);
      xhr.send(formData);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error during upload');
      setUploading(false);
      console.error('Stream upload error:', err);
    }
  };

  const resetForm = useCallback(() => {
    setFile(null);
    setTitle('');
    setDescription('');
    setProgress(0);
    setUploadedVideoId(null);
    setError(null);
    setUploading(false);
  }, []);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          Upload Stream
        </CardTitle>
        <CardDescription>
          Share your gameplay with the community
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {uploadedVideoId ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Upload Complete!</h3>
            <p className="text-muted-foreground mb-4">
              Your stream has been uploaded successfully
            </p>
            <Button onClick={resetForm} variant="outline">Upload Another</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="bg-destructive/15 p-3 rounded-md flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="title">Stream Title</Label>
              <Input 
                id="title"
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="Enter a title for your stream"
                disabled={uploading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input 
                id="description"
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Add a description (optional)"
                disabled={uploading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="file">Video File</Label>
              <div className="border border-dashed rounded-md p-8 text-center space-y-4">
                {file ? (
                  <div className="space-y-2">
                    <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / (1024 * 1024)).toFixed(2)}MB
                    </p>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setFile(null)}
                      disabled={uploading}
                    >
                      Change File
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p>Drag and drop your video file or click to browse</p>
                    <p className="text-xs text-muted-foreground">
                      Max size: {maxSize}MB. Supported formats: MP4, WebM, QuickTime
                    </p>
                  </>
                )}
                
                <Input 
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  accept={allowedTypes.join(',')}
                  className={file ? 'hidden' : 'absolute inset-0 opacity-0 cursor-pointer'}
                  disabled={uploading}
                />
              </div>
            </div>
            
            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Uploading...</span>
                  <span className="text-sm font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        {!uploadedVideoId && (
          <Button 
            className="w-full" 
            onClick={handleUpload} 
            disabled={!file || !title || uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Stream
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default StreamUploader;
