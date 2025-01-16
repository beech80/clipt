import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { StreamHealthIndicator } from './StreamHealthIndicator';
import { StreamMetrics } from './StreamMetrics';
import { QualitySelector } from './QualitySelector';

interface StreamPlayerProps {
  streamUrl?: string | null;
  isLive?: boolean;
  autoplay?: boolean;
  controls?: boolean;
  qualities?: string[];
  streamId?: string;
}

export const StreamPlayer = ({ 
  streamUrl, 
  isLive = false, 
  autoplay = true,
  controls = true,
  qualities = [],
  streamId
}: StreamPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [currentQuality, setCurrentQuality] = useState<string>('auto');
  const [healthStatus, setHealthStatus] = useState<string>('unknown');
  const [viewerCount, setViewerCount] = useState<number>(0);
  const [streamMetrics, setStreamMetrics] = useState({
    bitrate: 0,
    fps: 0,
    resolution: ''
  });

  useEffect(() => {
    if (!streamId) return;

    // Subscribe to stream health updates
    const healthChannel = supabase
      .channel('stream-health')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'streams',
          filter: `id=eq.${streamId}`
        },
        (payload) => {
          const { 
            health_status, 
            current_bitrate, 
            current_fps, 
            stream_resolution,
            viewer_count 
          } = payload.new;
          
          setHealthStatus(health_status || 'unknown');
          setViewerCount(viewer_count || 0);
          setStreamMetrics({
            bitrate: current_bitrate || 0,
            fps: current_fps || 0,
            resolution: stream_resolution || ''
          });

          if (health_status === 'critical') {
            toast.error('Stream health is critical. Please check your connection.');
          }
        }
      )
      .subscribe();

    // Increment viewer count when joining
    const incrementViewers = async () => {
      if (!streamId) return;
      
      const { error } = await supabase
        .from('streams')
        .update({ 
          viewer_count: viewerCount + 1 
        })
        .eq('id', streamId);

      if (error) {
        console.error('Error incrementing viewer count:', error);
      }
    };

    // Decrement viewer count when leaving
    const decrementViewers = async () => {
      if (!streamId) return;
      
      const { error } = await supabase
        .from('streams')
        .update({ 
          viewer_count: Math.max(0, viewerCount - 1)
        })
        .eq('id', streamId);

      if (error) {
        console.error('Error decrementing viewer count:', error);
      }
    };

    // Initialize viewer count
    incrementViewers();

    return () => {
      decrementViewers();
      supabase.removeChannel(healthChannel);
    };
  }, [streamId, viewerCount]);

  useEffect(() => {
    if (!streamUrl || !videoRef.current) return;

    const initPlayer = () => {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        });

        hlsRef.current = hls;
        hls.loadSource(streamUrl);
        hls.attachMedia(videoRef.current!);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (autoplay) {
            videoRef.current?.play().catch(() => {
              toast.error("Autoplay blocked. Please click play.");
            });
          }
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                initPlayer();
                break;
            }
          }
        });
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = streamUrl;
        if (autoplay) {
          videoRef.current.play().catch(() => {
            toast.error("Autoplay blocked. Please click play.");
          });
        }
      }
    };

    initPlayer();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [streamUrl, autoplay]);

  const handleQualityChange = (quality: string) => {
    const hls = hlsRef.current;
    if (!hls) return;

    setCurrentQuality(quality);
    if (quality === 'auto') {
      hls.currentLevel = -1;
    } else {
      const level = hls.levels.findIndex(
        level => level.height === parseInt(quality)
      );
      if (level !== -1) {
        hls.currentLevel = level;
      }
    }
  };

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden group">
      {!isLive && !streamUrl && (
        <div className="absolute inset-0 flex items-center justify-center text-white">
          Stream is offline
        </div>
      )}
      <video
        ref={videoRef}
        className="w-full h-full"
        controls={controls}
        playsInline
        poster={!isLive ? "/placeholder.svg" : undefined}
      />
      
      {isLive && (
        <>
          <StreamHealthIndicator 
            status={healthStatus}
            className="absolute top-4 left-4 bg-black/60 rounded-full px-3 py-1"
          />
          <div className="absolute top-4 right-4 bg-black/60 rounded-full px-3 py-1 text-white text-sm flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span>{viewerCount} watching</span>
          </div>
        </>
      )}

      <StreamMetrics
        bitrate={streamMetrics.bitrate}
        fps={streamMetrics.fps}
        className="absolute top-14 right-4 bg-black/60 rounded-full px-3 py-1"
      />
      
      <QualitySelector
        qualities={qualities}
        currentQuality={currentQuality}
        onQualityChange={handleQualityChange}
        className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
      />
    </div>
  );
};