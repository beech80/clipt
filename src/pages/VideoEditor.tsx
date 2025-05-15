import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'sonner';
import { supabase } from '../utils/supabaseClient';
import { useUser } from '../contexts/UserContext';
import { motion } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';

// Cosmic star component for background animation
const CosmicStar = ({ size, top, left, delay, duration }: { size: number, top: string, left: string, delay: number, duration: number }) => (
  <motion.div
    className="absolute rounded-full bg-white"
    style={{
      width: size,
      height: size,
      top,
      left,
      boxShadow: `0 0 ${size * 2}px ${size}px rgba(255, 255, 255, 0.7)`,
    }}
    initial={{ opacity: 0 }}
    animate={{ opacity: [0, 1, 0] }}
    transition={{
      repeat: Infinity,
      delay,
      duration,
      ease: "easeInOut",
    }}
  />
);

// Main component
const VideoEditor: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string>("");
  
  // Generate random stars for the cosmic background
  const stars = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    size: Math.random() * 3 + 1,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    delay: Math.random() * 5,
    duration: Math.random() * 3 + 2,
  }));

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
      });
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
  
  return (
    <div className="cosmic-uploader min-h-screen bg-gradient-to-b from-blue-950 via-indigo-900 to-purple-950 p-6">
      <Toaster position="top-center" />
      
      {/* Cosmic background stars */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {stars.map((star) => (
          <CosmicStar
            key={star.id}
            size={star.size}
            top={star.top}
            left={star.left}
            delay={star.delay}
            duration={star.duration}
          />
        ))}
      </div>
      
      {/* Hidden canvas for thumbnail generation */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      <div className="max-w-4xl mx-auto relative z-10">
        <header className="text-center mb-10">
          <motion.h1 
            className="text-4xl font-bold text-white mb-2"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            Cosmic Video Uploader
          </motion.h1>
          <motion.p 
            className="text-blue-300 text-xl"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Upload your video directly to the universe
          </motion.p>
        </header>
        
        <motion.div
          className="bg-blue-900/20 backdrop-blur-sm rounded-2xl border border-blue-500/30 overflow-hidden p-8 shadow-2xl"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          {!videoPreviewUrl ? (
            <motion.div 
              className="flex flex-col items-center justify-center border-2 border-dashed border-blue-500/50 rounded-lg p-10 h-80 cursor-pointer transition-all hover:border-purple-400 hover:bg-blue-900/30"
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
                className="w-20 h-20 rounded-full bg-blue-600/40 flex items-center justify-center mb-4"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <svg className="w-10 h-10 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </motion.div>
              <h3 className="text-xl font-semibold text-white mb-2">Select Your Cosmic Video</h3>
              <p className="text-blue-300 text-center max-w-md">
                Click to browse or drag & drop your video file here
              </p>
              <p className="text-blue-400 text-sm mt-4">
                Supported formats: MP4, WebM, MOV, AVI (Max 50MB)
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
                    className="px-4 py-2 rounded-md text-blue-300 hover:text-white hover:bg-blue-700/40 transition-colors"
                    onClick={triggerFileInput}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Change Video
                  </motion.button>
                </div>
                
                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-blue-300">
                      <span>Uploading to the cosmos...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-2 bg-blue-900/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
                
                <div className="flex justify-center pt-4">
                  <motion.button
                    className={`px-10 py-4 rounded-full text-white text-lg font-medium flex items-center justify-center space-x-2 ${
                      isUploading 
                        ? 'bg-blue-800/50 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg'
                    }`}
                    onClick={uploadAndGoToPostForm}
                    disabled={isUploading}
                    whileHover={isUploading ? {} : { scale: 1.05 }}
                    whileTap={isUploading ? {} : { scale: 0.95 }}
                  >
                    {isUploading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>Launch to Post Form</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
        
        <motion.div 
          className="mt-6 text-center text-blue-400 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p>Your video will be automatically uploaded and you'll be taken to the post form</p>
          <p className="mt-1">No trimming needed - just upload and go!</p>
        </motion.div>
      </div>
    </div>
  );
};

export default VideoEditor;
