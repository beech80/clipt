import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Toaster, toast } from 'sonner';
import { FaPlay, FaPause, FaSave, FaUpload, FaUndo, FaRedo, FaCheck, FaTimes } from 'react-icons/fa';
import { Loader2, Save, Undo, Redo, Download, Scissors, Play, Pause, Check, ChevronLeft, Upload, VideoIcon, Clock, RotateCw, RotateCcw, Crop, Edit, ChevronsLeft, ChevronsRight, Image, Star } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import FallbackVideoPlayer from "@/components/video/FallbackVideoPlayer";
import "@/components/video-fixes.css";
import "@/components/force-video-visibility.css";
import BasicVideoPlayer from "@/components/BasicVideoPlayer";
import EditorVideoPlayer from "@/components/video/EditorVideoPlayer";
import { Json } from "@/integrations/supabase/types";
import { formatTime } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";
import { motion, AnimatePresence } from "framer-motion";
import "@/styles/video-editor.css";

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

const VideoEditor = () => {
  // Canvas for thumbnail generation
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Function to publish directly to Clipts
  const publishToClipts = async () => {
    if (!videoBlob) {
      toast.error("No video available to publish");
      return;
    }
    
    // Generate a temporary ID if none exists
    const tempClipId = clipId || uuidv4();
    
    toast.loading("Preparing video for Clipts...", { id: "clipts-publish" });
    
    try {
      // Create thumbnail using canvas
      let thumbnail = null;
      
      if (videoRef.current) {
        // Create canvas if it doesn't exist
        if (!canvasRef.current) {
          const canvas = document.createElement('canvas');
          canvas.width = videoRef.current.videoWidth || 640;
          canvas.height = videoRef.current.videoHeight || 360;
          const ctx = canvas.getContext('2d');
          
          if (ctx && videoRef.current) {
            // Capture frame from the middle of trimmed section
            const captureTime = trimStart + ((trimEnd - trimStart) / 2);
            videoRef.current.currentTime = captureTime;
            
            // Wait for seeking to complete
            await new Promise(resolve => {
              const handleSeeked = () => {
                videoRef.current?.removeEventListener('seeked', handleSeeked);
                resolve(null);
              };
              videoRef.current.addEventListener('seeked', handleSeeked);
            });
            
            // Draw video frame to canvas
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            thumbnail = canvas.toDataURL('image/jpeg', 0.85);
          }
        }
      }
      
      // Navigate to Clipts with this video data
      navigate('/clipts', { 
        state: { 
          newClip: true, 
          clipId: tempClipId,
          videoBlob: videoBlob,
          thumbnail: thumbnail,
          trimStart: trimStart,
          trimEnd: trimEnd,
          title: `Cosmic Clip ${new Date().toLocaleDateString()}`,
          cosmic: true
        } 
      });
      
      toast.success("Video ready for Clipts!", { id: "clipts-publish" });
    } catch (error) {
      console.error('Error publishing to Clipts:', error);
      toast.error("Failed to prepare video for Clipts", { id: "clipts-publish" });
    }
  };
  const { id } = useParams();
  const navigate = useNavigate();
  const [editHistory, setEditHistory] = useState<any[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [clipId, setClipId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState('trim');
  const [processingTrim, setProcessingTrim] = useState(false);
  const [frameCapture, setFrameCapture] = useState<string | null>(null);
  
  // Video related states
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoObjectUrl, setVideoObjectUrl] = useState<string>("");
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoWidth, setVideoWidth] = useState(0);
  const [videoHeight, setVideoHeight] = useState(0);
  const [frameRate, setFrameRate] = useState(30); // Default assumed frame rate
  
  // Trim related states
  const [trimStart, setTrimStart] = useState(0); // In seconds
  const [trimEnd, setTrimEnd] = useState(0); // In seconds
  const [trimPreviewActive, setTrimPreviewActive] = useState(false);
  const [originalVideo, setOriginalVideo] = useState<Blob | null>(null);
  const [trimHistory, setTrimHistory] = useState<{start: number, end: number}[]>([]);
  const [keyframes, setKeyframes] = useState<number[]>([]);
  const [showKeyframes, setShowKeyframes] = useState(true);
  
  // Define the state for edit mode
  const [isNewMode, setIsNewMode] = useState(id === 'new');
  const [timeSegments, setTimeSegments] = useState<number[]>([]);
  const [showTrimControls, setShowTrimControls] = useState(true);

  // Handle file selection for upload with enhanced reliability
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
    
    // Simple reset of states first
    setVideoDuration(0);
    setTrimStart(0);
    setTrimEnd(0);
    
    // Create a quick preview to check if the file is valid
    try {
      const objectUrl = URL.createObjectURL(file);
      const testVideo = document.createElement('video');
      testVideo.src = objectUrl;
      testVideo.muted = true;
      testVideo.preload = 'metadata'; // Just load metadata first
      testVideo.onloadedmetadata = () => {
        console.log('Video metadata loaded, duration:', testVideo.duration);
        // Success! File is valid
      };
      testVideo.onerror = () => {
        toast.error('This video file appears to be corrupted or unsupported');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      };
      // Will immediately release the URL when done testing
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (e) {
      console.error('Error previewing file:', e);
      toast.error('Could not preview this file'); 
      return;
    }
    
    // Continue with upload
    uploadVideo(file);
  };

  // Upload video to storage and create post record - LOCAL FIRST APPROACH
  const uploadVideo = async (file: File) => {
    // This is a unique ID for the primary toast notification
    const toastId = `upload-${Date.now()}`;
    toast.loading('Loading video for editing...', { id: toastId });
    
    try {
      // ================ STEP 1: LOCAL SETUP (HAPPENS IMMEDIATELY) ================
      // Create immediate local preview - this is the most critical part
      const immediatePreviewUrl = URL.createObjectURL(file);
      setVideoObjectUrl(immediatePreviewUrl);
      setVideoUrl(immediatePreviewUrl); 
      setVideoLoaded(true);
      setVideoBlob(file); 
      setOriginalVideo(file);
      setIsNewMode(false); // Force UI to show editing mode immediately
      
      // Setup a video element to get metadata
      const videoElement = document.createElement('video');
      videoElement.src = immediatePreviewUrl;
      videoElement.muted = true;
      videoElement.onloadedmetadata = () => {
        setVideoDuration(videoElement.duration);
        setTrimEnd(videoElement.duration);
        toast.success('Video ready for editing!', { id: toastId });
        
        // Add a tip about trim feature
        setTimeout(() => {
          toast.info('Tip: You can trim this video using the controls on the right', { duration: 5000 });
        }, 2000);
      };
      
      // Show user immediate success - the most important part is done
      toast.success('Video loaded successfully!', { id: toastId });
      
      // ================ STEP 2: OPTIONAL CLOUD UPLOAD (CAN FAIL) ================
      // This part is completely optional - if it fails, user can still edit locally
      // We'll attempt this in the background using a non-blocking approach
      
      // Add a skip button for cloud upload
      const skipToastId = 'skip-upload-' + Date.now();
      toast.loading(
        <div>
          Cloud upload starting... 
          <button 
            className="ml-2 px-2 py-1 bg-gray-700 rounded text-white text-xs" 
            onClick={() => {
              toast.dismiss(skipToastId);
              toast.success('Cloud upload skipped. You can still edit locally!', { duration: 3000 });
            }}
          >
            Skip cloud upload
          </button>
        </div>, 
        { id: skipToastId, duration: 30000 }
      );
      
      // Now do the cloud upload in a non-blocking way
      setTimeout(async () => {
        try {
          // Auth check
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            toast.error('Not signed in - using local mode only', { id: skipToastId });
            return;
          }
          
          // Generate filename and path
          const fileExt = file.name.split('.').pop();
          const fileName = `${uuidv4()}.${fileExt}`;
          const filePath = `uploads/${user.id}/${fileName}`;
          
          toast.loading('Uploading to cloud...', { id: skipToastId });
          
          // Actual upload - but with a shorter timeout and upsert true
          const uploadController = new AbortController();
          const timeoutId = setTimeout(() => uploadController.abort(), 15000); // 15 second timeout
          
          try {
            const { error } = await supabase.storage
              .from('videos')
              .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true,
                abortSignal: uploadController.signal,
              });
              
            if (error) throw error;
            
            // Get URL - this should be quick
            const { data: { publicUrl } } = supabase.storage.from('videos').getPublicUrl(filePath);
            if (!publicUrl) throw new Error('Failed to get public URL');
            
            // Quick DB insert
            const { data: dbData, error: dbError } = await supabase
              .from('posts')
              .insert([{
                user_id: user.id,
                video_url: publicUrl,
                status: 'draft',
                title: file.name.split('.')[0]
              }])
              .select('id')
              .single();
            
            if (dbError) throw dbError;
            
            // Success path
            setClipId(dbData.id);
            setVideoUrl(publicUrl); // Store URL but keep using object URL for better performance
            navigate(`/edit/${dbData.id}`, { replace: true });
            toast.success('Cloud save complete!', { id: skipToastId });
          } catch (cloudError: any) {
            console.error('Cloud process error:', cloudError);
            toast.error(`Cloud save failed: ${cloudError.message || 'Unknown error'}`, { id: skipToastId, duration: 3000 });
          } finally {
            clearTimeout(timeoutId);
          }
        } catch (e) {
          console.error('Background upload error:', e);
          toast.error('Failed to save to cloud (local only mode)', { id: skipToastId, duration: 3000 });
        }
      }, 1000); // 1 second delay before starting cloud upload
      
      return true; // Local setup was successful
    } catch (error: any) {
      // Something went wrong with the local setup (very unlikely)
      console.error('Video loading error:', error);
      toast.error(`Could not load video: ${error.message || 'Unknown error'}`, { id: toastId });
      return false;
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // Handle video metadata loaded
  const handleVideoLoaded = () => {
    if (videoRef.current) {
      const duration = videoRef.current.duration;
      console.log('Video loaded with duration:', duration);
      
      setVideoDuration(duration);
      setVideoLoaded(true);
      
      // Initialize trim end to full duration if not set
      if (trimEnd === 0) {
        setTrimEnd(duration);
      }
      
      // Start playing automatically
      try {
        const playPromise = videoRef.current.play();
        
        // Handle play promise for browsers that return one
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.error('Auto-play prevented', err);
            // Show play button or instructions if autoplay fails
            toast.info('Click the play button to view the video');
          });
        }
      } catch (err) {
        console.error('Error in play attempt', err);
      }
      
      // Make sure video is visible
      videoRef.current.style.display = 'block';
      videoRef.current.style.height = '70vh';
      videoRef.current.style.objectFit = 'cover';
    }
  };
  
  // Handle play/pause
  const togglePlayPause = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(err => {
        console.error('Error playing video:', err);
      });
    }
  };
  
  // Toggle trim preview mode
  const toggleTrimPreview = () => {
    setTrimPreviewActive(!trimPreviewActive);
    
    // Reset video position when toggling preview
    if (videoRef.current) {
      if (!trimPreviewActive) { // About to turn preview ON
        videoRef.current.currentTime = trimStart;
      } else { // About to turn preview OFF
          
        if (error) throw error;
        
        // Get URL - this should be quick
        const { data: { publicUrl } } = supabase.storage.from('videos').getPublicUrl(filePath);
        if (!publicUrl) throw new Error('Failed to get public URL');
        
        // Quick DB insert
        const { data: dbData, error: dbError } = await supabase
          .from('posts')
          .insert([{
            user_id: user.id,
            video_url: publicUrl,
            status: 'draft',
            title: file.name.split('.')[0]
          }])
          .select('id')
          .single();
        
        if (dbError) throw dbError;
        
        // Success path
        setClipId(dbData.id);
        setVideoUrl(publicUrl); // Store URL but keep using object URL for better performance
        navigate(`/edit/${dbData.id}`, { replace: true });
        toast.success('Cloud save complete!', { id: skipToastId });
      } catch (cloudError: any) {
        console.error('Cloud process error:', cloudError);
        toast.error(`Cloud save failed: ${cloudError.message || 'Unknown error'}`, { id: skipToastId, duration: 3000 });
      } finally {
        clearTimeout(timeoutId);
              trim_start: trimStart,
              trim_end: trimEnd,
              status: 'trimmed'
            })
            .eq('id', clipId)
            .then(({ error }) => {
              if (error) {
                console.error('Error saving trim settings:', error);
                toast.error('Cloud save failed, but trim is applied locally', { id: dbToastId });
                
                // Still navigate to post form even if cloud save failed
                setTimeout(() => navigate(`/post-form?clipId=${clipId}`), 1000);
              } else {
                toast.success('Trim settings saved to cloud!', { id: dbToastId });
                
                // Navigate to post form after successful save with a slight delay to show the success message
                setTimeout(() => navigate(`/post-form?clipId=${clipId}`), 1000);
              }
            })
            .catch(err => {
              console.error('Exception saving trim:', err);
      setTrimPreviewActive(false); // Disable preview mode on error
    }
  };

  // Additional useEffect to handle video availability
  useEffect(() => {
    if (videoObjectUrl || videoUrl) {
      // If we have a video, ensure we're in edit mode
      if (isNewMode) {
        setIsNewMode(false);
      }
    }
  }, [videoObjectUrl, videoUrl]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-6">
      <Toaster position="top-center" />
      <h1 className="text-3xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
        Clip Editor Studio
      </h1>
      
      {/* Enhanced Video Upload Zone with Animation */}
      {!videoLoaded && (
        <motion.div 
          className="mb-8 p-8 border-2 border-dashed border-violet-500/50 rounded-lg text-center cursor-pointer bg-black/70 backdrop-blur hover:border-violet-400" 
          onClick={() => fileInputRef.current?.click()}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(139, 92, 246, 0.3)" }}
          whileTap={{ scale: 0.98 }}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-violet-500" />
          <h2 className="text-xl font-bold mb-2 text-white">Upload Your Video</h2>
          <p className="text-gray-400">Click to browse or drop your video file here</p>
          <p className="text-xs text-gray-500 mt-2">MP4, WebM, or MOV up to 50MB</p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
            className="hidden"
          />
        </motion.div>
      )}
      
      {isNewMode && (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-700 rounded-lg mb-8 hover:border-purple-500 transition-all">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className={`px-8 py-4 rounded-lg flex items-center space-x-3 text-lg font-medium transition-all ${isUploading 
              ? 'bg-blue-700 text-white cursor-wait' 
              : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white transform hover:scale-105'}`}
            disabled={isUploading}
          >
            <FaUpload className="mr-2" />
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
      
      {(videoObjectUrl || videoUrl) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          <div className="md:col-span-2">
            <Card className="p-4 h-full overflow-hidden">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Preview</h3>
                
                {/* Video Display */}
                <div 
                  className="relative overflow-hidden rounded-lg bg-black trim-preview video-player-container" 
                  style={{ display: 'block' }}
                >
                  {videoUrl || videoObjectUrl ? (
                    <>
                      <BasicVideoPlayer
                        ref={videoRef}
                        src={videoObjectUrl || videoUrl}
                        onLoaded={(duration) => {
                          setVideoDuration(duration);
                          setVideoLoaded(true);
                          if (trimEnd === 0) {
                            setTrimEnd(duration);
                          }
                        }}
                        controls={!trimPreviewActive}
                        autoPlay={isPlaying}
                        muted={false}
                        loop={trimPreviewActive}
                      <p className="text-muted-foreground">No video selected</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
          
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
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoEditor;
