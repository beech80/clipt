import React, { useEffect, useRef, useState } from 'react';
import { Card } from "@/components/ui/card";
import { StreamHealthIndicator } from "./health/StreamHealthIndicator";
import { StreamChat } from "./chat/StreamChat";
import { generatePlaybackUrl } from "@/config/streamingConfig";
import { CloudArrowUp, ShieldCheck, Gauge } from "lucide-react";

interface StreamPlayerProps {
  streamId: string;
  title?: string;
  isLive?: boolean;
  viewerCount?: number;
  playbackUrl?: string;
  // Cloudflare specific properties
  cfAccountId?: string;
  cfStreamKey?: string;
  quality?: 'auto' | '1080p' | '720p' | '480p' | '360p';
}

export const StreamPlayer = ({ 
  streamId,
  title = 'Live Stream',
  isLive = false,
  viewerCount = 0,
  playbackUrl,
  quality = 'auto',
  cfAccountId,
  cfStreamKey
}: StreamPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playerState, setPlayerState] = useState<'loading' | 'playing' | 'error'>('loading');
  const [bufferingState, setBufferingState] = useState<boolean>(false);
  
  // If no playbackUrl is provided, generate one from the streamId using Cloudflare's format
  const effectivePlaybackUrl = playbackUrl || (streamId ? generatePlaybackUrl(streamId) : undefined);
  
  // If quality is specified and not auto, append the quality to the URL
  const finalPlaybackUrl = quality !== 'auto' && effectivePlaybackUrl 
    ? `${effectivePlaybackUrl.replace('/manifest/video.m3u8', '')}/manifest/video-${quality}.m3u8` 
    : effectivePlaybackUrl;
  
  useEffect(() => {
    // Handle Cloudflare Stream player setup
    if (videoRef.current && finalPlaybackUrl) {
      // Add event listeners for stream state
      const videoEl = videoRef.current;
      
      const handlePlaying = () => {
        setPlayerState('playing');
        setBufferingState(false);
      };
      
      const handleWaiting = () => {
        setBufferingState(true);
      };
      
      const handleError = (e: any) => {
        console.error('Video playback error:', e);
        setPlayerState('error');
      };
      
      videoEl.addEventListener('playing', handlePlaying);
      videoEl.addEventListener('waiting', handleWaiting);
      videoEl.addEventListener('error', handleError);
      
      // If stream is live, attempt to play automatically
      if (isLive) {
        const playPromise = videoEl.play();
        
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error('Error auto-playing video:', error);
            // Most browsers require user interaction to play video with sound
            // We'll keep the video muted so it can autoplay
            videoEl.muted = true;
            videoEl.play().catch(e => console.error('Still cannot play:', e));
          });
        }
      }
      
      return () => {
        videoEl.removeEventListener('playing', handlePlaying);
        videoEl.removeEventListener('waiting', handleWaiting);
        videoEl.removeEventListener('error', handleError);
      };
    }
  }, [isLive, finalPlaybackUrl]);

  if (!finalPlaybackUrl) {
    return (
      <Card className="aspect-video w-full bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-4 text-gray-400">Waiting for stream...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      <div className="lg:col-span-3 space-y-4">
        <Card className="p-4">
          <div className="aspect-video relative bg-gray-900">
            {bufferingState && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                <div className="spinner-border animate-spin w-8 h-8 border-4 rounded-full border-blue-500 border-r-transparent" />
              </div>
            )}
            {playerState === 'error' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                <div className="text-center text-red-500">
                  <p>Stream playback error</p>
                  <button 
                    className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded" 
                    onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.load();
                        videoRef.current.play().catch(e => console.error('Retry play error:', e));
                        setPlayerState('loading');
                      }
                    }}
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}
            <video
              ref={videoRef}
              className="w-full h-full"
              src={finalPlaybackUrl}
              autoPlay
              playsInline
              muted
              controls
            />
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">{title}</h2>
              <p className="text-sm text-muted-foreground">
                {viewerCount} {viewerCount === 1 ? 'viewer' : 'viewers'}
              </p>
            </div>
            <div className="flex items-center gap-3 ml-auto">
              {/* Cloudflare Stream indicators */}
              <div className="flex items-center text-sm text-green-500" title="Cloudflare protected stream">
                <ShieldCheck className="w-4 h-4 mr-1" />
                <span>Protected</span>
              </div>
              <div className="flex items-center text-sm text-blue-500" title="Cloudflare CDN">
                <CloudArrowUp className="w-4 h-4 mr-1" />
                <span>Cloudflare</span>
              </div>
              <StreamHealthIndicator 
                status={isLive ? 'excellent' : 'offline'} 
                className=""
              />
            </div>
          </div>
        </Card>
      </div>
      <div className="lg:col-span-1">
        <StreamChat streamId={streamId} isLive={isLive} />
      </div>
    </div>
  );
};
