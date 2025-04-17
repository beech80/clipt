import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Toaster, toast } from 'sonner';
import { FaScissors, FaPlay, FaPause, FaSave, FaUpload, FaUndo, FaRedo, FaCheck, FaTimes } from 'react-icons/fa';
import { Loader2, Save, Undo, Redo, Download, Scissors, Play, Pause, Check, ChevronLeft, Upload } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FallbackVideoPlayer from "@/components/video/FallbackVideoPlayer";
import EditorVideoPlayer from "@/components/video/EditorVideoPlayer";
import { Json } from "@/integrations/supabase/types";
import { formatTime } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";

interface ClipEditingSession {
  id?: string;
  user_id?: string;
  clip_id?: string;
  effects: any[];
  edit_history: any[][];
  trim_start?: number;
  trim_end?: number;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

const ClipEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [editHistory, setEditHistory] = useState<any[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [clipId, setClipId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Video related states
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoObjectUrl, setVideoObjectUrl] = useState<string>("");
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  
  // Trim related states
  const [trimStart, setTrimStart] = useState(0); // In seconds
  const [trimEnd, setTrimEnd] = useState(0); // In seconds
  const [trimPreviewActive, setTrimPreviewActive] = useState(false);
  const [originalVideo, setOriginalVideo] = useState<Blob | null>(null);
  
  // Determine if we're in "new" mode
  const isNewMode = id === 'new';

  // Load post data instead of clip
  const { data: clipData, isLoading: clipLoading } = useQuery({
    queryKey: ['post', id],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error loading post:', error);
        throw error;
      }
    },
    enabled: !!id && id !== 'new',
    onSuccess: (data) => {
      if (data?.video_url) {
        setVideoUrl(data.video_url);
        setClipId(data.id);
      }
    }
  });

  // Load editing session
  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ['editing-session', id],
    queryFn: async () => {
      try {
        // Try to get trim settings directly from posts table first
        const { data: postData, error: postError } = await supabase
          .from('posts')
          .select('trim_start, trim_end')
          .eq('id', id)
          .single();
        
        if (!postError && postData) {
          // Apply previous trim settings if they exist in the post
          if (postData.trim_start !== undefined && postData.trim_end !== undefined) {
            setTrimStart(postData.trim_start);
            setTrimEnd(postData.trim_end || videoDuration);
          }
        }
        
        // Still check for editing session table if it exists
        const { data: dbData, error } = await supabase
          .from('post_editing_sessions') // Changed from clip_editing_sessions
          .select('*')
          .eq('post_id', id) // Changed from clip_id
          .single();
        
        if (error && error.code !== 'PGRST116') {
          // Ignore if table doesn't exist - this is a fallback anyway
          console.log('No editing session table found or other error:', error);
          return null;
        }
        
        if (dbData) {
          const parsedHistory = (dbData.edit_history as unknown as any[][]) || [];

          // Apply previous trim settings if they exist
          if (dbData.trim_start !== undefined && dbData.trim_end !== undefined) {
            setTrimStart(dbData.trim_start);
            setTrimEnd(dbData.trim_end || videoDuration);
          }

          return {
            ...dbData,
            edit_history: parsedHistory
          } as ClipEditingSession;
        }
        return null;
      } catch (error) {
        console.error('Error loading editing session:', error);
        // Don't throw here - just return null so the app continues
        return null;
      }
    },
    enabled: !!id && id !== 'new' && !!clipId
  });

  // Save session mutation
  const saveMutation = useMutation({
    mutationFn: async (updatedData: Partial<ClipEditingSession> = {}) => {
      try {
        if (!clipId) throw new Error('No post ID available');
        
        // First save trim settings to the post directly
        const { error: updatePostError } = await supabase
          .from('posts')
          .update({
            trim_start: trimStart,
            trim_end: trimEnd || videoDuration,
            duration: (trimEnd || videoDuration) - trimStart,
            updated_at: new Date().toISOString()
          })
          .eq('id', clipId);
          
        if (updatePostError) {
          console.warn('Error updating post with trim settings:', updatePostError);
          // Continue anyway - we'll try to save to the session
        }
        
        // Rest of the editing data can be stored in a session if needed
        // But only try this if the table exists
        try {
          const { data, error } = await supabase
            .from('post_editing_sessions') 
            .select('*')
            .eq('post_id', clipId) 
            .single();
          
          const newData = {
            post_id: clipId, 
            user_id: (await supabase.auth.getUser()).data.user?.id,
            effects: [],
            edit_history: [...(editHistory || [])],
            trim_start: trimStart,
            trim_end: trimEnd || videoDuration,
            status: 'in_progress',
            updated_at: new Date().toISOString(),
            ...updatedData
          };
          
          if (!data || error) {
            // Create new session
            const { error: insertError } = await supabase
              .from('post_editing_sessions') 
              .insert({
                ...newData,
                created_at: new Date().toISOString()
              });
            
            if (insertError) {
              console.warn('Could not create editing session, likely table does not exist:', insertError);
              // Don't throw - we've already saved to the post
            }
          } else {
            // Update existing session
            const { error: updateError } = await supabase
              .from('post_editing_sessions') 
              .update(newData)
              .eq('id', data.id);
            
            if (updateError) {
              console.warn('Could not update editing session:', updateError);
              // Don't throw - we've already saved to the post
            }
          }
        } catch (sessionError) {
          console.warn('Error with editing sessions - table may not exist:', sessionError);
          // Don't throw - we've already saved to the post
        }
        
        return true;
      } catch (error) {
        console.error('Error saving editing session:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('Changes saved!');
    },
    onError: (error) => {
      console.error('Save error:', error);
      toast.error('Failed to save changes');
    }
  });

  // Publish clip mutation
  const publishMutation = useMutation({
    mutationFn: async () => {
      try {
        const { error } = await supabase
          .from('clips')
          .update({ status: 'published' })
          .eq('id', clipId);

        if (error) throw error;
        return true;
      } catch (error) {
        console.error('Publish error:', error);
        throw error;
      }
    },
    onSuccess: (data: any) => {
      toast.success('Clip published successfully!');
      // Navigate to view the published clip
      navigate('/clip/' + clipId);
    },
    onError: (error) => {
      console.error('Publish error:', error);
      toast.error('Failed to publish clip');
    }
  });

  // Handle video metadata loaded
  const handleVideoLoaded = () => {
    if (videoRef.current) {
      const duration = videoRef.current.duration;
      setVideoDuration(duration);
      
      // Initialize trim end to full duration if not set
      if (trimEnd === 0) {
        setTrimEnd(duration);
      }
      
      setVideoLoaded(true);
    }
  };

  // Handle video time update with improved trim preview
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    
    const currentVideoTime = video.currentTime;
    setCurrentTime(currentVideoTime);
    
    // Handle trim preview loop
    if (trimPreviewActive) {
      // If we've reached the trim end point, loop back to start point
      if (currentVideoTime >= trimEnd || currentVideoTime < trimStart) {
        video.currentTime = trimStart;
        
        // Ensure video continues playing
        if (video.paused && isPlaying) {
          video.play().catch(err => {
            console.error('Error playing video during trim loop:', err);
          });
        }
      }
      
      // If somehow the current time is before the trim start during preview, 
      // move to the trim start
      if (currentVideoTime < trimStart) {
        video.currentTime = trimStart;
      }
    }
  };

  // Handle play/pause
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        if (trimPreviewActive && currentTime >= trimEnd) {
          videoRef.current.currentTime = trimStart;
        }
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  // Enable/disable trim preview mode
  const toggleTrimPreview = () => {
    // If we're already in preview mode, turn it off
    if (trimPreviewActive) {
      setTrimPreviewActive(false);
      
      // Reset video state
      if (videoRef.current) {
        videoRef.current.pause();
      }
      return;
    }
    
    // Otherwise, enter preview mode
    setTrimPreviewActive(true);
    toast.info(`Previewing ${(trimEnd - trimStart).toFixed(1)}s trim`);
    
    // Set video position to trim start and play
    if (videoRef.current) {
      videoRef.current.currentTime = trimStart;
      videoRef.current.play().catch(err => {
        console.error('Error playing video:', err);
        toast.error('Could not play video. The file might still be processing.');
      });
    }
  };

  // Apply trim to create a new video
  const handleTrim = async () => {
    try {
      if (!videoRef.current || !videoUrl) {
        toast.error('No video available to trim');
        return;
      }
      
      // Make sure the trim range is valid
      if (trimEnd <= trimStart) {
        toast.error('Invalid trim range: end time must be greater than start time');
        return;
      }
      
      // Show toast with progress
      const toastId = toast.loading('Applying trim settings...');
      
      // Store the trim settings for later use
      setEditHistory(prev => [
        ...prev, 
        `Trimmed video from ${trimStart.toFixed(2)}s to ${trimEnd.toFixed(2)}s (${(trimEnd - trimStart).toFixed(2)}s duration)`
      ]);
      
      // Update the post record to store the trim settings
      const { error: updateError } = await supabase
        .from('posts')
        .update({
          trim_start: trimStart,
          trim_end: trimEnd,
          duration: trimEnd - trimStart,
          updated_at: new Date().toISOString()
        })
        .eq('id', clipId);
      
      if (updateError) {
        console.error('Failed to save trim settings:', updateError);
        toast.error('Failed to save trim settings', { id: toastId });
        return;
      }
      
      // Set video current time to match trim start
      if (videoRef.current) {
        videoRef.current.currentTime = trimStart;
      }
      
      // Small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update toast and show success
      toast.success('Trim settings applied successfully!', { id: toastId });
      
      // Automatically start preview mode to show the trimmed video
      setTimeout(() => {
        setTrimPreviewActive(true);
        
        // Ensure video is at the trim start position
        if (videoRef.current) {
          videoRef.current.currentTime = trimStart;
          videoRef.current.play().catch(err => console.error('Error playing video after trim:', err));
        }
      }, 500);
      
      // Save session
      saveMutation.mutate();
    } catch (error) {
      console.error('Error applying trim:', error);
      toast.error('Failed to apply trim');
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      // Apply the previous state
    }
  };

  const handleRedo = () => {
    if (historyIndex < editHistory.length - 1) {
      setHistoryIndex(historyIndex + 1);
      // Apply the next state
    }
  };

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      if (trimPreviewActive) {
        video.currentTime = trimStart;
        video.play().catch(e => console.error('Error auto-playing video:', e));
      }
    };

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', onEnded);
    video.addEventListener('loadedmetadata', handleVideoLoaded);
    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('loadedmetadata', handleVideoLoaded);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [trimPreviewActive, trimStart]);

  // Handle file selection for upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    const acceptedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    if (!acceptedTypes.includes(file.type)) {
      toast.error('Please select a valid video file (MP4, WebM, MOV, or AVI)');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    
    // Validate file size (max 50MB for Supabase free tier)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      toast.error(`File size exceeds 50MB limit (${(file.size / (1024 * 1024)).toFixed(2)}MB)`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    
    console.log('Uploading file:', file.name, file.type, file.size);
    toast.info(`Starting upload of ${file.name}`);
    
    // Reset video states
    setVideoBlob(null);
    setVideoObjectUrl('');
    setVideoDuration(0);
    setTrimStart(0);
    setTrimEnd(0);
    
    // Proceed with upload
    uploadVideo(file);
  };
  
  // Upload video to storage and create post record
  const uploadVideo = async (file: File) => {  
    if (!file) {
      toast.error('No file selected');
      return;
    }
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      toast.error('You must be logged in to upload videos');
      return;
    }
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      const toastId = toast.loading('Starting upload...');
      
      // Create a new ID for the post
      const newPostId = uuidv4();
      setClipId(newPostId);
      
      // Generate file path for videos folder
      const fileExt = file.name.split('.').pop();
      const filePath = `videos/${user.id}/${newPostId}.${fileExt}`;
      
      // Add short delay to ensure storage is ready
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Explicitly set the content type
      const contentType = file.type || 'video/mp4';
      console.log(`File content type: ${contentType}`);
      
      // Log file details for debugging
      console.log('Uploading file:', {
        name: file.name,
        size: file.size,
        type: file.type,
        path: filePath,
        contentType
      });
      
      // Function to track upload progress
      const onUploadProgress = (progress: any) => {
        const percent = progress.percent || 0;
        console.log(`Upload progress: ${percent.toFixed(2)}%`);
        setUploadProgress(Math.round(percent));
        
        // Update toast with progress
        toast.loading(`Uploading: ${Math.round(percent)}%`, {
          id: toastId
        });
      };
      
      // Upload file to storage
      setUploadProgress(10);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file, {
          cacheControl: '3600',
          contentType,
          upsert: true,
          onUploadProgress
        });
      
      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        toast.error(`Upload failed: ${uploadError.message}`, { id: toastId });
        throw new Error(`Upload failed: ${uploadError.message}`);
      }
      
      setUploadProgress(75);
      toast.loading('Processing video...', { id: toastId });
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);
      
      const videoUrl = publicUrl;
      setVideoUrl(videoUrl);
      setUploadProgress(95);
      
      // Create post record in database
      console.log('Saving to database as a post:', { newPostId, user_id: user.id, video_url: videoUrl });
      
      const { data: insertData, error: dbError } = await supabase
        .from('posts')
        .insert({
          id: newPostId,
          user_id: user.id,
          video_url: videoUrl,
          content: file.name.split('.')[0] || 'New Video',
          post_type: 'video',
          is_published: true,
          created_at: new Date().toISOString()
        })
        .select();
      
      if (dbError) {
        console.error('Database insert error details:', dbError);
        toast.error(`Error saving to database: ${dbError.message || 'Unknown error'}`, { id: toastId });
        throw new Error(`Error saving to database: ${dbError.message || 'Unknown error'}`);
      }
      
      // Fetch the video as a blob to enable client-side editing
      try {
        // Update progress toast
        toast.loading('Loading video for editing...', { id: toastId });
        
        // Add a short delay to ensure Supabase has processed the video
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const videoRes = await fetch(videoUrl);
        
        if (!videoRes.ok) {
          console.error('Failed to fetch video from URL:', videoUrl, videoRes.status, videoRes.statusText);
          toast.error('Failed to fetch video for editing', { id: toastId });
          throw new Error(`Failed to fetch the uploaded video: ${videoRes.status} ${videoRes.statusText}`);
        }
        
        const videoBlob = await videoRes.blob();
        setVideoBlob(videoBlob);
        setOriginalVideo(videoBlob); // Store original for editing
        
        // Create object URL for immediate display
        const objectUrl = URL.createObjectURL(videoBlob);
        setVideoObjectUrl(objectUrl);
        setVideoLoaded(true);
        
        // Set initial values for trim once video is loaded
        const video = videoRef.current;
        if (video) {
          video.src = objectUrl;
          video.onloadedmetadata = () => {
            const duration = video.duration;
            console.log('Video loaded with duration:', duration);
            setVideoDuration(duration);
            setTrimEnd(duration);
            video.currentTime = 0;
          };
        }
        
        toast.success('Upload complete! Video ready for editing', { id: toastId });
      } catch (fetchError) {
        console.error('Error fetching video for editing:', fetchError);
        toast.error('Could not load video for editing', { id: toastId });
      }
      
      setUploadProgress(100);
      return newPostId;
    } catch (error: any) {
      console.error('Upload error:', error);
      let errorMessage = 'An unknown error occurred';
      
      // Improved error handling with detailed logging
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        name: error?.name
      });
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.error_description) {
        errorMessage = error.error_description;
      }
      
      toast.error(`Upload failed: ${errorMessage}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Clear the file input
      }
    }
  };

  useEffect(() => {
    if (!videoRef.current || !videoObjectUrl) return;
    
    const videoElement = videoRef.current;
    
    // Function to handle time updates and implement trim preview
    const handleTimeUpdate = () => {
      if (previewMode && videoElement.currentTime >= (trimEnd || videoDuration)) {
        videoElement.currentTime = trimStart;
        videoElement.play().catch(err => console.error('Error playing video:', err));
      }
    };
    
    // Set initial position when preview mode changes
    if (previewMode) {
      videoElement.currentTime = trimStart;
      videoElement.play().catch(err => console.error('Error playing video:', err));
    } else {
      videoElement.pause();
    }
    
    // Add and remove event listeners
    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [previewMode, trimStart, trimEnd, videoObjectUrl, videoDuration]);

  // Loading state
  if (clipLoading || sessionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-6">
      <Toaster position="top-center" />
      <h1 className="text-3xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
        Clip Editor Studio
      </h1>
      
      {isNewMode && (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-700 rounded-lg mb-8 hover:border-purple-500 transition-all">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className={`px-8 py-4 rounded-lg flex items-center space-x-3 text-lg font-medium transition-all ${isUploading 
              ? 'bg-blue-700 text-white cursor-wait' 
              : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white transform hover:scale-105'}`}
            disabled={isUploading}
          >
            <FaUpload />
            <span>
              {isUploading 
                ? `Uploading (${Math.round(uploadProgress)}%)` 
                : 'Upload Video'}
            </span>
          </button>
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="video/*"
            className="hidden"
          />
          <p className="mt-4 text-gray-400 text-sm">Max 50MB - MP4, WebM, MOV</p>
        </div>
      )}
      
      {!isNewMode && videoUrl && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          <div className="md:col-span-2">
            <Card className="p-4 h-full overflow-hidden">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Preview</h3>
                
                {/* Video Display */}
                <div 
                  className="relative overflow-hidden rounded-lg bg-black aspect-video" 
                  style={{ display: 'block', height: '70vh' }}
                >
                  {videoUrl || videoObjectUrl ? (
                    <>
                      <EditorVideoPlayer 
                        ref={videoRef}
                        src={videoObjectUrl || videoUrl}
                        onLoadedMetadata={handleVideoLoaded}
                        onTimeUpdate={handleTimeUpdate}
                        controls={!trimPreviewActive}
                        playing={isPlaying}
                        startTime={trimPreviewActive ? trimStart : 0}
                        endTime={trimPreviewActive ? trimEnd : undefined}
                        previewMode={trimPreviewActive}
                        muted={false}
                        autoPlay={false}
                        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                      />
                      
                      {/* Video Controls */}
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="bg-black/70 hover:bg-black/90"
                          onClick={togglePlayPause}
                        >
                          {isPlaying ? (
                            <><FaPause className="mr-2" /> Pause</>
                          ) : (
                            <><FaPlay className="mr-2" /> Play</>
                          )}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <p>No video selected</p>
                    </div>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline" 
                    onClick={handleTrim}
                    disabled={!videoLoaded || trimPreviewActive || trimStart === 0 && trimEnd === videoDuration}
                  >
                    <Scissors className="w-4 h-4 mr-2" />
                    Apply Trim
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleUndo}
                    disabled={!videoLoaded || historyIndex <= 0}
                  >
                    <Undo className="w-4 h-4 mr-2" />
                    Undo
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleRedo}
                    disabled={!videoLoaded || historyIndex >= editHistory.length - 1}
                  >
                    <Redo className="w-4 h-4 mr-2" />
                    Redo
                  </Button>
                  
                  <Button
                    variant="default"
                    className="ml-auto bg-purple-600 hover:bg-purple-700"
                    onClick={() => {
                      if (clipId && videoUrl) {
                        navigate(`/new-post?clipId=${clipId}&videoUrl=${encodeURIComponent(videoUrl)}`);
                      } else {
                        toast.error('Please upload and edit a video first');
                      }
                    }}
                    disabled={!videoLoaded || !clipId || !videoUrl}
                  >
                    Next: Add Caption
                  </Button>
                </div>
                
                {videoUrl && (
                  <div className="flex gap-4">
                    <Button
                      variant="default"
                      className="flex-1"
                      onClick={() => saveMutation.mutate()}
                      disabled={saveMutation.isPending}
                    >
                      {saveMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save Draft
                    </Button>
                    
                    <Button
                      variant="default"
                      className="flex-1 bg-gaming-600 hover:bg-gaming-700"
                      onClick={() => publishMutation.mutate()}
                      disabled={publishMutation.isPending}
                    >
                      {publishMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4 mr-2" />
                      )}
                      Publish
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>
          
          {/* Trim Settings */}
          <div className="md:col-span-1">
          <Card className="p-4 h-full">
            <h3 className="text-lg font-semibold mb-4">Trim Settings</h3>
            
            <div className="space-y-6">
              {/* Trim Controls */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Trim Video Clip</h4>
                </div>
                
                {/* Start Time */}
                <div className="space-y-2">
                  <Label htmlFor="trimStart">Start Time</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="trimStart"
                      type="number"
                      min={0}
                      max={trimEnd}
                      step={0.1}
                      value={trimStart.toFixed(1)}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        setTrimStart(value > trimEnd ? trimEnd : value);
                      }}
                      disabled={!videoLoaded}
                    />
                    <span className="text-sm text-muted-foreground w-20">
                      {formatTime(trimStart)}
                    </span>
                  </div>
                </div>
                
                {/* End Time */}
                <div className="space-y-2">
                  <Label htmlFor="trimEnd">End Time</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="trimEnd"
                      type="number"
                      min={trimStart}
                      max={videoDuration}
                      step={0.1}
                      value={trimEnd.toFixed(1)}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        setTrimEnd(value < trimStart ? trimStart : (value > videoDuration ? videoDuration : value));
                      }}
                      disabled={!videoLoaded}
                    />
                    <span className="text-sm text-muted-foreground w-20">
                      {formatTime(trimEnd)}
                    </span>
                  </div>
                </div>
                
                {/* Trim Slider */}
                <div className="pt-4">
                  <Slider
                    value={[trimStart, trimEnd]}
                    min={0}
                    max={videoDuration || 100}
                    step={0.1}
                    onValueChange={([start, end]) => {
                      setTrimStart(start);
                      setTrimEnd(end);
                    }}
                    disabled={!videoLoaded}
                  />
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>{formatTime(0)}</span>
                    <span>{formatTime(videoDuration)}</span>
                  </div>
                </div>
                
                {/* Trim Preview Button */}
                <Button 
                  onClick={toggleTrimPreview} 
                  variant={trimPreviewActive ? "default" : "outline"}
                  className="w-full mt-2"
                  disabled={!videoLoaded}
                >
                  {trimPreviewActive ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Exit Preview Mode
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Preview Trimmed Clip
                    </>
                  )}
                </Button>
              </div>
              
              {/* Trim Info */}
              <div className="p-3 bg-muted/50 rounded-md">
                <h4 className="text-sm font-medium mb-2">Trim Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Original Duration:</span>
                    <span>{formatTime(videoDuration)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">New Duration:</span>
                    <span>{formatTime(trimEnd - trimStart)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reduction:</span>
                    <span>{videoDuration ? `${Math.round(100 - ((trimEnd - trimStart) / videoDuration * 100))}%` : '0%'}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ClipEditor;

