import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, Volume2, VolumeX, Settings, AlertCircle, RotateCcw, ChevronDown } from "lucide-react";
import { LoadingFallback } from "@/components/ui/LoadingStates";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

interface MuxPlayerProps {
  playbackId: string;
  poster?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  onError?: (error: Error) => void;
  onPlaying?: () => void;
  onPause?: () => void;
  className?: string;
  preload?: 'auto' | 'metadata' | 'none';
  optimizeForLowBandwidth?: boolean;
  lowBandwidthThreshold?: number; // in kbps
}

const MuxPlayer: React.FC<MuxPlayerProps> = ({
  playbackId,
  poster,
  autoPlay = false,
  muted = false,
  loop = false,
  onError,
  onPlaying,
  onPause,
  className = '',
  preload = 'auto',
  optimizeForLowBandwidth = true,
  lowBandwidthThreshold = 1500 // 1.5 Mbps default threshold
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [progress, setProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bandwidth, setBandwidth] = useState<number | null>(null);
  const [availableQualities, setAvailableQualities] = useState<Array<{level: number, height: number, bitrate: number}>>([]);
  const [currentQuality, setCurrentQuality] = useState<string>('Auto');
  const retryCount = useRef(0);

  const handleRetry = useCallback(() => {
    setError(null);
    setIsLoading(true);
    retryCount.current = 0;
    initializePlayer();
  }, [playbackId]);

  const initializePlayer = useCallback(() => {
    const video = videoRef.current;
    if (!video || !playbackId) return;

    // Clean up any existing HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
    }

    setIsLoading(true);
    setError(null);
    const playbackUrl = `https://stream.mux.com/${playbackId}.m3u8`;

    if (Hls.isSupported()) {
      // Configure HLS based on bandwidth optimization settings
      const hlsConfig = {
        enableWorker: true,
        lowLatencyMode: false, // Low latency mode can cause more buffering on poor connections
        startLevel: -1, // Auto
        abrEwmaDefaultEstimate: 1000000, // 1 Mbps initial estimate
        abrBandWidthFactor: 0.95, // Be slightly conservative
        abrBandWidthUpFactor: 0.7, // Be more conservative when going up a level
        abrMaxWithRealBitrate: true, // Use the real bitrate for ABR decisions
        maxBufferLength: optimizeForLowBandwidth ? 30 : 10, // Longer buffer for low bandwidth
        maxMaxBufferLength: optimizeForLowBandwidth ? 60 : 30, // Maximum buffer length
        initialLiveManifestSize: 1, // Start faster
        maxLoadingDelay: 4, // Max time (in seconds) to wait before loading starts
        xhrSetup: (xhr) => {
          // Set explicit Accept header to avoid MIME type issues
          xhr.setRequestHeader('Accept', 'application/vnd.apple.mpegurl, application/x-mpegurl, */*');
        }
      };

      const hls = new Hls(hlsConfig);
      hlsRef.current = hls;
      
      // Track bandwidth for UI display
      hls.on(Hls.Events.FRAG_LOAD_PROGRESS, (_event, data) => {
        if (data.stats && data.stats.loaded > 0 && data.stats.trequest > 0) {
          const downloadDuration = (performance.now() - data.stats.trequest);
          const bandwidth = Math.round((data.stats.loaded * 8) / (downloadDuration / 1000));
          setBandwidth(bandwidth);
          
          // Adapt player behavior based on bandwidth
          if (optimizeForLowBandwidth && bandwidth < lowBandwidthThreshold * 1000) {
            // For low bandwidth connections, we might:
            // 1. Force a lower quality level
            // 2. Increase buffer size (already done in config)
            if (availableQualities.length > 1) {
              const lowQualityLevel = [...availableQualities]
                .sort((a, b) => a.bitrate - b.bitrate)[0].level;
              
              // Only force if we're not already at the lowest level
              if (hls.currentLevel !== lowQualityLevel && hls.currentLevel !== -1) {
                console.log('Low bandwidth detected, switching to lower quality');
                hls.nextLevel = lowQualityLevel;
              }
            }
          }
        }
      });

      // Enhanced retry logic with exponential backoff
      const maxAttempts = 3;

      const loadWithRetry = () => {
        try {
          setIsLoading(true);
          hls.loadSource(playbackUrl);
          hls.attachMedia(video);
        } catch (err) {
          console.error('Error loading HLS source:', err);
          if (retryCount.current < maxAttempts) {
            retryCount.current++;
            const backoffTime = Math.min(1000 * Math.pow(2, retryCount.current), 8000);
            console.log(`Retrying HLS load (${retryCount.current}/${maxAttempts}) in ${backoffTime}ms...`);
            setTimeout(loadWithRetry, backoffTime);
          } else {
            const errorMessage = 'Unable to load video. Please check your connection and try again.';
            setError(errorMessage);
            setIsLoading(false);
            onError?.(new Error(errorMessage));
          }
        }
      };

      loadWithRetry();

      // Parse manifest and prepare quality options
      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        setIsLoaded(true);
        setIsLoading(false);
        
        // Extract available quality levels
        if (data.levels.length > 0) {
          const qualities = data.levels.map((level, index) => ({
            level: index,
            height: level.height,
            bitrate: level.bitrate
          }));
          setAvailableQualities(qualities);
          
          // For very slow connections, start with a lower quality
          if (optimizeForLowBandwidth && navigator?.connection?.downlink) {
            // downlink is in Mbps
            const connectionSpeed = navigator.connection.downlink * 1000; // convert to kbps
            if (connectionSpeed > 0 && connectionSpeed < lowBandwidthThreshold) {
              // Find appropriate quality level based on connection speed
              const appropriateLevel = qualities
                .filter(q => q.bitrate < connectionSpeed * 800) // 80% of connection speed
                .sort((a, b) => b.bitrate - a.bitrate)[0];
                
              if (appropriateLevel) {
                hls.currentLevel = appropriateLevel.level;
                setCurrentQuality(`${appropriateLevel.height}p`);
                console.log(`Low bandwidth detected (${connectionSpeed}kbps), starting at ${appropriateLevel.height}p`);
              }
            }
          }
        }
        
        if (autoPlay) {
          // Use a more reliable approach for autoplay
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                setIsPlaying(true);
                console.log('Autoplay started successfully');
              })
              .catch(err => {
                console.warn('Autoplay prevented:', err);
                // If autoplay fails due to browser policy, mute and try again
                if (err.name === 'NotAllowedError') {
                  video.muted = true;
                  setIsMuted(true);
                  video.play()
                    .then(() => setIsPlaying(true))
                    .catch(e => console.error('Failed even with muted autoplay:', e));
                }
              });
          }
        }
      });

      // Enhanced error handling and recovery
      hls.on(Hls.Events.ERROR, (_, data) => {
        console.warn('HLS error:', data);
        
        // Non-fatal errors: just log them
        if (!data.fatal) {
          return;
        }
        
        // Fatal errors: try to recover
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            console.log('Fatal network error, attempting to recover...');
            if (retryCount.current < 5) {
              retryCount.current++;
              // For network errors, try to reload with a short delay
              setTimeout(() => {
                hls.startLoad();
              }, 1000 * retryCount.current); // Exponential backoff
            } else {
              // After multiple attempts, suggest a refresh
              const errorMsg = 'Network error: Please check your connection or try refreshing the page.';
              setError(errorMsg);
              setIsLoading(false);
              onError?.(new Error(errorMsg));
            }
            break;
            
          case Hls.ErrorTypes.MEDIA_ERROR:
            console.log('Media error, attempting to recover...');
            if (retryCount.current < 3) {
              retryCount.current++;
              hls.recoverMediaError();
            } else {
              // After multiple attempts to recover media error
              const errorMsg = 'Media playback error. Please try again.';
              setError(errorMsg);
              setIsLoading(false);
              onError?.(new Error(errorMsg));
            }
            break;
            
          default:
            console.error('Unrecoverable HLS error:', data);
            const errorMsg = `Playback error: ${data.details}`;
            setError(errorMsg);
            setIsLoading(false);
            onError?.(new Error(errorMsg));
            break;
        }
      });

      // Add level switching capability
      const switchQuality = (level: number) => {
        if (!hlsRef.current) return;
        
        hlsRef.current.currentLevel = level;
        if (level === -1) {
          setCurrentQuality('Auto');
        } else if (availableQualities[level]) {
          setCurrentQuality(`${availableQualities[level].height}p`);
        }
      };
      
      // Expose the switchQuality function
      window.switchQuality = switchQuality;
      
      return () => {
        window.switchQuality = undefined;
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = playbackUrl;
      video.addEventListener('loadedmetadata', () => {
        setIsLoaded(true);
        setIsLoading(false);
        if (autoPlay) {
          video.play()
            .then(() => setIsPlaying(true))
            .catch(err => {
              console.error('Error during native HLS playback:', err);
              if (err.name === 'NotAllowedError') {
                // Try muted autoplay as fallback
                video.muted = true;
                setIsMuted(true);
                video.play()
                  .then(() => setIsPlaying(true))
                  .catch(e => {
                    console.error('Failed even with muted autoplay:', e);
                    setError('Unable to start playback automatically. Please tap to play.');
                  });
              }
            });
        }
      });
      
      video.addEventListener('error', (e) => {
        const errorCode = video.error?.code;
        let errorMsg = 'An error occurred during playback';
        
        switch(errorCode) {
          case 1: // MEDIA_ERR_ABORTED
            errorMsg = 'Playback was aborted';
            break;
          case 2: // MEDIA_ERR_NETWORK
            errorMsg = 'A network error caused playback to fail';
            break;
          case 3: // MEDIA_ERR_DECODE
            errorMsg = 'The video could not be decoded';
            break;
          case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
            errorMsg = 'The video format is not supported';
            break;
        }
        
        setError(errorMsg);
        setIsLoading(false);
        onError?.(new Error(errorMsg));
      });
    } else {
      // No HLS support at all
      setError('Your browser does not support HLS video playback');
      setIsLoading(false);
      onError?.(new Error('HLS not supported in this browser'));
    }
  }, [playbackId, autoPlay, onError, optimizeForLowBandwidth, lowBandwidthThreshold]);
  
  // Initialize the player when component mounts
  useEffect(() => {
    initializePlayer();
  }, [initializePlayer]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      setProgress((video.currentTime / video.duration) * 100);
    };

    video.addEventListener('timeupdate', updateProgress);
    return () => video.removeEventListener('timeupdate', updateProgress);
  }, []);

  const togglePlay = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      onPause?.();
    } else {
      videoRef.current.play();
      setIsPlaying(true);
      onPlaying?.();
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Quality switching function
  const switchQuality = (level: number) => {
    if (!hlsRef.current) return;
    
    hlsRef.current.currentLevel = level;
    if (level === -1) {
      setCurrentQuality('Auto');
    } else if (availableQualities[level]) {
      setCurrentQuality(`${availableQualities[level].height}p`);
    }
  };
  
  return (
    <div className={`relative group ${className}`}>
      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/70">
          <div className="text-center p-4 max-w-xs">
            <AlertCircle className="mx-auto h-10 w-10 text-red-500 mb-2" />
            <p className="text-white mb-4">{error}</p>
            <Button 
              onClick={handleRetry} 
              variant="outline"
              className="bg-gaming-800 hover:bg-gaming-700 border-purple-800"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      )}
      
      {/* Loading state */}
      {isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/70">
          <LoadingFallback variant="gaming" message="Loading video..." />
        </div>
      )}
      
      {/* Actual video element */}
      <video
        ref={videoRef}
        poster={poster}
        muted={isMuted}
        loop={loop}
        playsInline
        preload={preload}
        className={`w-full h-full object-cover ${!isLoaded || isLoading ? 'invisible' : ''}`}
      />

      {/* Video controls overlay */}
      <div 
        className={`absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/60 to-transparent 
          ${isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'} transition-opacity duration-300`}
      >
        <Progress value={progress} className="h-1 mb-3" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlay}
              className="text-white hover:text-white/80 h-8 w-8"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              className="text-white hover:text-white/80 h-8 w-8"
            >
              {isMuted ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </Button>
          </div>
          
          {/* Quality selector dropdown */}
          {availableQualities.length > 1 && hlsRef.current && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-white hover:text-white/80 bg-black/30 text-xs gap-1 h-7 px-2"
                >
                  <Settings className="h-3 w-3" />
                  {currentQuality || 'Auto'}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-black/90 border-gray-800">
                <DropdownMenuItem 
                  className="text-white hover:bg-white/10 text-xs cursor-pointer"
                  onClick={() => switchQuality(-1)}
                >
                  Auto (Recommended)
                </DropdownMenuItem>
                
                {availableQualities
                  .sort((a, b) => b.height - a.height) // Sort by resolution, highest first
                  .map((quality) => (
                    <DropdownMenuItem 
                      key={quality.level}
                      className="text-white hover:bg-white/10 text-xs cursor-pointer"
                      onClick={() => switchQuality(quality.level)}
                    >
                      {quality.height}p ({Math.round(quality.bitrate/1000)} kbps)
                    </DropdownMenuItem>
                  ))
                }
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        {/* Show bandwidth indicator for developers */}
        {process.env.NODE_ENV === 'development' && bandwidth && (
          <div className="absolute bottom-0 right-0 text-[10px] text-white/50 p-1">
            {(bandwidth / 1000000).toFixed(2)} Mbps
          </div>
        )}
      </div>
    </div>
  );
};

export default MuxPlayer;