import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { FileVideo, Scissors, Play, Pause, RotateCcw, CheckCircle, ArrowLeft, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const VideoEditor = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [startTrim, setStartTrim] = useState(0);
  const [endTrim, setEndTrim] = useState(100);
  const [isTrimming, setIsTrimming] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isDraggingStart, setIsDraggingStart] = useState(false);
  const [isDraggingEnd, setIsDraggingEnd] = useState(false);

  // Clear any previous video data when component mounts
  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type.startsWith('video/')) {
      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setVideoUrl(url);
      setStartTrim(0);
      setEndTrim(100);
      setCurrentTime(0);

      // Reset video player when new file is selected
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        setIsPlaying(false);
      }
    }
  };

  const handleVideoLoaded = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        // If at the end of the trimmed section, go back to start
        if (currentTime >= (endTrim / 100) * duration) {
          videoRef.current.currentTime = (startTrim / 100) * duration;
        }
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const newTime = videoRef.current.currentTime;
      setCurrentTime(newTime);

      // If we're in trim preview mode and reached the end of the trim
      if (isTrimming && newTime >= (endTrim / 100) * duration) {
        videoRef.current.pause();
        setIsPlaying(false);
        // Loop back to start trim
        videoRef.current.currentTime = (startTrim / 100) * duration;
      }
    }
  };

  const handleSliderChange = (value: number[]) => {
    if (videoRef.current) {
      const newTime = (value[0] / 100) * duration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleStartTrimChange = (value: number[]) => {
    setStartTrim(value[0]);
    if (videoRef.current && isTrimming) {
      videoRef.current.currentTime = (value[0] / 100) * duration;
      setCurrentTime((value[0] / 100) * duration);
    }
  };

  const handleEndTrimChange = (value: number[]) => {
    setEndTrim(value[0]);
    if (videoRef.current && isTrimming) {
      videoRef.current.currentTime = (value[0] / 100) * duration;
      setCurrentTime((value[0] / 100) * duration);
    }
  };

  const toggleTrimming = () => {
    setIsTrimming(!isTrimming);
    if (!isTrimming && videoRef.current) {
      // When starting to trim, set video position to trim start
      videoRef.current.currentTime = (startTrim / 100) * duration;
      setCurrentTime((startTrim / 100) * duration);
      setIsPlaying(false);
      videoRef.current.pause();
    }
  };

  const handleSubmit = () => {
    if (!file) return;
    
    setIsProcessing(true);
    
    // Simulate processing time
    setTimeout(() => {
      // In a real implementation, you would trim the video here using a library
      // For now, we'll just navigate to the post form with the video file info
      setIsProcessing(false);
      
      // Navigate to post form with video info
      navigate('/post-form', {
        state: {
          videoFile: file,
          videoInfo: {
            originalDuration: duration,
            trimStart: (startTrim / 100) * duration,
            trimEnd: (endTrim / 100) * duration,
            filename: file.name
          }
        }
      });
    }, 2000);
  };

  return (
    <div className="bg-gray-900 min-h-screen flex flex-col px-4 py-6">
      <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/post-selection')}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-white">Video Editor</h1>
        </div>

        <AnimatePresence mode="wait">
          {!videoUrl ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-600 rounded-lg p-8"
            >
              <FileVideo className="h-16 w-16 text-gray-500 mb-4" />
              <h2 className="text-xl font-semibold text-gray-300 mb-2">Select a video to edit</h2>
              <p className="text-gray-400 mb-6 text-center max-w-md">
                Choose a video file to trim and share as a clipt
              </p>
              <label htmlFor="video-upload" className="cursor-pointer">
                <div className="flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-lg transition">
                  <Upload className="mr-2 h-5 w-5" />
                  Select Video
                </div>
                <input
                  id="video-upload"
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col"
            >
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-4">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  onLoadedMetadata={handleVideoLoaded}
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={() => setIsPlaying(false)}
                  className="w-full h-full object-contain"
                ></video>
                
                {/* Trim indicators */}
                {isTrimming && (
                  <>
                    <div 
                      className="absolute top-0 left-0 h-full bg-black/60 pointer-events-none"
                      style={{ width: `${startTrim}%` }}
                    />
                    <div 
                      className="absolute top-0 right-0 h-full bg-black/60 pointer-events-none"
                      style={{ width: `${100 - endTrim}%` }}
                    />
                  </>
                )}
                
                {/* Play/Pause overlay */}
                {!isPlaying && (
                  <div 
                    className="absolute inset-0 flex items-center justify-center"
                    onClick={handlePlayPause}
                  >
                    <div className="bg-black/40 rounded-full p-4 cursor-pointer hover:bg-black/60 transition">
                      <Play className="h-8 w-8 text-white" />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mb-6">
                <div className="text-gray-300">{formatTime(currentTime)}</div>
                <div className="flex space-x-2">
                  <Button
                    variant={isPlaying ? "secondary" : "default"}
                    size="icon"
                    onClick={handlePlayPause}
                  >
                    {isPlaying ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5" />
                    )}
                  </Button>
                  <Button
                    variant={isTrimming ? "default" : "outline"}
                    onClick={toggleTrimming}
                  >
                    <Scissors className="h-5 w-5 mr-1" />
                    {isTrimming ? "Trimming" : "Trim"}
                  </Button>
                </div>
                <div className="text-gray-300">{formatTime(duration)}</div>
              </div>

              <div className="space-y-6 mb-6">
                <div className="px-2">
                  <Slider
                    value={[Math.floor((currentTime / duration) * 100) || 0]}
                    onValueChange={handleSliderChange}
                    min={0}
                    max={100}
                    step={1}
                    className="cursor-pointer"
                  />
                </div>

                {isTrimming && (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <label className="text-sm text-gray-400">Start Trim</label>
                        <span className="text-sm text-gray-400">
                          {formatTime((startTrim / 100) * duration)}
                        </span>
                      </div>
                      <Slider
                        value={[startTrim]}
                        onValueChange={handleStartTrimChange}
                        min={0}
                        max={endTrim - 1}
                        step={1}
                        className="cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <label className="text-sm text-gray-400">End Trim</label>
                        <span className="text-sm text-gray-400">
                          {formatTime((endTrim / 100) * duration)}
                        </span>
                      </div>
                      <Slider
                        value={[endTrim]}
                        onValueChange={handleEndTrimChange}
                        min={startTrim + 1}
                        max={100}
                        step={1}
                        className="cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-auto">
                <Button
                  onClick={handleSubmit}
                  disabled={isProcessing}
                  className="w-full py-6 text-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {isProcessing ? (
                    <>
                      <span className="mr-2">Processing...</span>
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-5 w-5" />
                      Continue to Post
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VideoEditor;
