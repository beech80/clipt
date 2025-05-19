import React, { useState, useRef, useEffect } from 'react';
import '../gaming/GamingTheme.css';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';

// Gaming & Streaming background component
const GamingBackground = () => (
  <div className="gaming-background">
    <div className="gaming-grid"></div>
    <div className="gaming-overlay"></div>
    <div className="gaming-cityscape"></div>
    <div className="gaming-scanline"></div>
    
    {/* Gaming notification effects */}
    {Array.from({ length: 3 }).map((_, i) => (
      <motion.div 
        key={`notification-${i}`}
        className="gaming-notification"
        style={{ top: `${10 + i * 8}%` }}
        initial={{ right: -300, opacity: 0 }}
        animate={{ 
          right: '1rem',
          opacity: 1,
          transition: { delay: i * 3 }
        }}
        exit={{ right: -300, opacity: 0 }}
        transition={{ 
          duration: 0.5,
          repeat: Infinity,
          repeatDelay: 7.5,
          repeatType: 'reverse'
        }}
      >
        {['NEW GAME', 'HIGHLIGHT SAVED', 'STREAM READY'][i]}
      </motion.div>
    ))}
    
    {/* Game status indicators */}
    <div className="gaming-status" style={{top: '1rem', right: '1rem'}}>
      LIVE
    </div>
    <div className="gaming-status" style={{bottom: '1rem', left: '1rem'}}>
      GAMING MODE
    </div>
    
    {/* Gaming controller buttons */}
    <div className="gaming-controls" style={{bottom: '1rem', right: '1rem'}}>
      <div className="gaming-control-btn gaming-btn-a">A</div>
      <div className="gaming-control-btn gaming-btn-b">B</div>
      <div className="gaming-control-btn gaming-btn-x">X</div>
      <div className="gaming-control-btn gaming-btn-y">Y</div>
    </div>
  </div>
);

// Main component
const VideoEditor: React.FC = () => {
  // Disable scrolling
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, []);

  const navigate = useNavigate();
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string>("");

  // GTA-style retro theme configuration
  const gtaColors = {
    primary: "#ff6600",     // Orange
    secondary: "#9333ea",   // Purple
    accent: "#ef4444",      // Red
    dark: "#111111",        // Near black
    text: "#ffffff"         // White
  };

  // Setup gaming tips that rotate like console loading screens
  const loadingTips = [
    "Stream regularly to build your gaming audience",
    "Interact with viewers to increase engagement",
    "Use hashtags to reach more gaming viewers",
    "Collaborate with other streamers to grow faster",
    "Share clips from your best gaming moments",
    "Set a consistent streaming schedule",
    "Upgrade your gaming gear for better quality",
    "Don't forget to promote your streams on social media"
  ];

  const [currentTip, setCurrentTip] = useState(loadingTips[0]);

  // Rotate through tips like GTA loading screens
  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (loadingTips.indexOf(currentTip) + 1) % loadingTips.length;
      setCurrentTip(loadingTips[nextIndex]);
    }, 4000);
    
    return () => clearInterval(interval);
  }, [currentTip]);

  // Generate thumbnail from video
  const generateThumbnail = (video: HTMLVideoElement): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        const canvas = canvasRef.current;
        if (!canvas) {
          reject('Canvas element not found');
          return;
        }

        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw the video frame at the current time
        const context = canvas.getContext('2d');
        if (context) {
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          // Convert canvas to data URL
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(dataUrl);
        } else {
          reject('Could not get canvas context');
        }
      } catch (error) {
        console.error('Error generating thumbnail:', error);
        reject(error);
      }
    });
  };

  // Handle file selection for upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    const acceptedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    if (!acceptedTypes.includes(file.type)) {
      toast.error('Please select a valid video file (MP4, WebM, MOV, or AVI)');
      return;
    }
    
    // Validate file size (max 50MB for example)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      toast.error(`File size exceeds 50MB limit (${(file.size / (1024 * 1024)).toFixed(2)}MB)`);
      return;
    }
    
    // Create object URL for preview
    const objectUrl = URL.createObjectURL(file);
    setVideoPreviewUrl(objectUrl);
    setVideoFile(file);
    
    // Load video metadata
    const video = document.createElement('video');
    video.src = objectUrl;
    video.onloadedmetadata = () => {
      setVideoDuration(video.duration);
    };
  };

  // Upload video and go directly to post form
  const uploadAndGoToPostForm = async () => {
    if (!videoFile || !videoRef.current) {
      toast.error("Please select a cosmic video first");
      return;
    }

    try {
      setIsUploading(true);
      const toastId = "video-upload";
      toast.loading("Preparing your cosmic video for upload...", { id: toastId });
      
      // Generate a thumbnail from the current frame
      const thumbnailDataUrl = await generateThumbnail(videoRef.current);
      
      // Convert data URL to Blob for upload
      const thumbnailResponse = await fetch(thumbnailDataUrl);
      const thumbnailBlob = await thumbnailResponse.blob();
      
      // Generate unique IDs for storage paths
      const uniqueVideoId = uuidv4();
      const thumbnailId = uuidv4();
      
      // Upload the video to Supabase Storage
      setUploadProgress(10);
      const { data: videoData, error: videoError } = await supabase.storage
        .from('clips')
        .upload(`${uniqueVideoId}.mp4`, videoFile, {
          cacheControl: '3600',
          upsert: false,
        });
      
      if (videoError) {
        throw new Error(`Failed to upload video: ${videoError.message}`);
      }
      
      setUploadProgress(70);
      
      // Upload the thumbnail to Supabase Storage
      const { data: thumbnailData, error: thumbnailError } = await supabase.storage
        .from('thumbnails')
        .upload(`${thumbnailId}.jpg`, thumbnailBlob, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg',
        });
      
      if (thumbnailError) {
        throw new Error(`Failed to upload thumbnail: ${thumbnailError.message}`);
      }
      
      setUploadProgress(100);
      toast.success("Cosmic video ready for posting!", { id: toastId });
      
      // Clean up the object URL
      URL.revokeObjectURL(videoPreviewUrl);
      
      // Save details to localStorage to prevent route state issues
      localStorage.setItem('clipt_upload_data', JSON.stringify({
        videoUrl: `${supabase.supabaseUrl}/storage/v1/object/public/clips/${uniqueVideoId}.mp4`,
        thumbnailUrl: `${supabase.supabaseUrl}/storage/v1/object/public/thumbnails/${thumbnailId}.jpg`,
        clipId: uniqueVideoId,
        videoDuration: videoDuration
      }));
      
      // Use window.location for a direct browser navigation instead of React Router
      window.location.href = '/post-form';
    } catch (error: any) {
      console.error('Error uploading:', error);
      toast.error(error.message || "Failed to prepare your cosmic video", { id: "video-upload" });
      setIsUploading(false);
    }
  };

  // Triggered when input button is clicked
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Prevent scrolling in a more targeted way
  const handleScroll = (e) => {
    if (e.target === document || e.target === document.body || e.target === document.documentElement) {
      window.scrollTo(0, 0);
      e.preventDefault();
      return false;
    }
  };

  return (
    <div 
      className="gaming-theme"
      style={{ minHeight: '100vh' }}
      onWheel={handleScroll}
      onTouchMove={handleScroll}
    >
      <Toaster position="top-center" />
      
      {/* GTA-style background */}
      <GamingBackground />
      
      {/* Adding GTA-style CSS */}
      {/* Scanning line effect */}
      <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
        <div className="scanning-line"></div>
      </div>
      
      {/* Hidden canvas for thumbnail generation */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div className="max-w-4xl mx-auto h-full w-full relative z-10 px-6 py-6 flex flex-col items-center justify-center" style={{ overflow: 'hidden', maxHeight: '100vh' }}>
        <header className="text-center mb-10">
          <motion.h1
            className="text-5xl font-bold text-white mb-4 gta-title tracking-wider"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            style={{ textShadow: '0 0 10px #ff6600, 0 0 20px #ff6600' }}
          >
            VIDEO UPLOADER
          </motion.h1>

          {/* GTA-style loading tip */}
          <motion.div
            className="relative border-l-4 border-orange-500 pl-3 py-2 bg-black/50 max-w-lg mx-auto mb-6"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <motion.p
              className="text-sm text-white font-mono"
              key={currentTip} // Re-render on tip change
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              style={{ textShadow: '0 0 5px rgba(255,255,255,0.5)' }}
            >
              TIP: {currentTip}
            </motion.p>
          </motion.div>
        </header>

        <motion.div
          className="bg-black/70 backdrop-blur-sm rounded-none border-2 border-orange-500 overflow-hidden p-8 shadow-2xl"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          {!videoPreviewUrl ? (
            <motion.div
              className="flex flex-col items-center justify-center border-2 border-dashed border-orange-500/70 p-10 h-80 cursor-pointer transition-all hover:border-orange-400 hover:bg-orange-900/20"
              onClick={triggerFileInput}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileSelect}
                accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
              />
              <motion.div
                className="w-20 h-20 rounded-none border-2 border-orange-500 flex items-center justify-center mb-4 bg-black/50"
                animate={{ borderColor: ['#ff6600', '#ef4444', '#ff6600'] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <svg className="w-10 h-10 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </motion.div>
              <h3 className="text-xl font-semibold text-white mb-2">Select Your Cosmic Video</h3>
              <p className="text-xl text-white font-bold mb-2 uppercase tracking-wide">
                DROP VIDEO FILE
              </p>
              <p className="text-sm text-orange-400 text-center border border-orange-500/50 py-1 px-2 font-mono bg-black/30">
                MP4, WebM, MOV, AVI (Max 50MB)
              </p>
            </motion.div>
          ) : (
            <div className="space-y-6">
              <div className="aspect-video rounded-lg overflow-hidden bg-black/60">
                <video
                  ref={videoRef}
                  src={videoPreviewUrl}
                  className="w-full h-full object-contain"
                  controls
                  preload="metadata"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-white truncate max-w-md">
                    {videoFile?.name || "Your Cosmic Video"}
                  </h3>
                  <motion.button
                    className="px-4 py-2 border border-orange-500 text-orange-400 hover:text-white hover:bg-orange-700/40 transition-colors uppercase tracking-wider font-mono text-sm"
                    onClick={triggerFileInput}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Change File
                  </motion.button>
                </div>

                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-blue-300">
                      <span>Uploading to the cosmos...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-4 bg-black border border-orange-500 overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-orange-500 to-red-500"
                        style={{ width: `${uploadProgress}%` }}
                        animate={isUploading ? { opacity: [0.7, 1, 0.7] } : {}}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-center pt-4">
                  <motion.button
                    className={`px-10 py-4 text-white text-lg uppercase font-bold tracking-wider flex items-center justify-center space-x-2 border-2 ${
                      isUploading
                        ? 'border-gray-600 bg-gray-800/50 cursor-not-allowed'
                        : 'border-orange-500 bg-black hover:bg-orange-900/30 shadow-lg'
                    }`}
                    onClick={uploadAndGoToPostForm}
                    disabled={isUploading}
                    whileHover={isUploading ? {} : { scale: 1.05, boxShadow: '0 0 15px rgba(255, 102, 0, 0.5)' }}
                    whileTap={isUploading ? {} : { scale: 0.95 }}
                  >
                    {isUploading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="#ff6600" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>CONTINUE</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        <motion.div
          className="mt-6 text-center text-orange-400 text-sm border-t border-orange-500/30 pt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p className="font-mono">GAMING UPLOAD - SHARE YOUR BEST MOMENTS</p>
          <div className="mt-2 flex justify-center space-x-2">
            <div className="h-1 w-10 bg-orange-500"></div>
            <div className="h-1 w-4 bg-orange-500"></div>
            <div className="h-1 w-2 bg-orange-500"></div>
          </div>
          
          {/* Console loading bar */}
          <div className="mt-4 w-full h-2 bg-gray-800 overflow-hidden">
            <div className="console-loading"></div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VideoEditor;
