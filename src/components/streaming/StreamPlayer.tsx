
import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import {useQuery} from '@tanstack/react-query';
import {useAuth} from '@/contexts/AuthContext';
import {isObsPlaybackMarker,resolveObsPlayback} from '@/services/obsBroadcastService';
import {isNativePlaybackMarker,resolveNativePlayback} from '@/native/broadcast/session';
import { Button } from '@/components/ui/button';
import { Card } from "@/components/ui/card";
import { StreamHealthIndicator } from "./health/StreamHealthIndicator";
import { StreamChat } from "./chat/StreamChat";
import { streamPlaybackError } from '@/lib/streamPlaybackError';

interface StreamPlayerProps {
  streamId: string;
  title?: string;
  isLive?: boolean;
  viewerCount?: number;
  playbackUrl?: string;
  compact?: boolean;
  showHealth?: boolean;
  offlineMessage?: string;
}

export const StreamPlayer = ({ 
  streamId,
  title = 'Live Stream',
  isLive = false,
  viewerCount,
  playbackUrl: suppliedPlaybackUrl,
  compact = false,
  showHealth = true,
  offlineMessage = 'Stream is offline'
}: StreamPlayerProps) => {
  const {user}=useAuth();
  const obsStream=isObsPlaybackMarker(suppliedPlaybackUrl,streamId);
  const privateStream=obsStream||isNativePlaybackMarker(suppliedPlaybackUrl,streamId);
  const privatePlayback=useQuery({
    queryKey:[obsStream?'obs-live-playback':'native-live-playback',streamId,user?.id],
    enabled:privateStream&&isLive&&Boolean(user),retry:false,staleTime:30000,gcTime:0,
    queryFn:()=>obsStream?resolveObsPlayback(streamId):resolveNativePlayback(streamId),
    refetchInterval:query=>query.state.data?Math.max(10000,query.state.data.expiresAt-Date.now()-60000):false,
    refetchIntervalInBackground:false,
  });
  const playbackUrl=privateStream?(!privatePlayback.isError&&privatePlayback.data&&privatePlayback.data.expiresAt>Date.now()?privatePlayback.data.url:undefined):suppliedPlaybackUrl;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playbackError, setPlaybackError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [needsPlay, setNeedsPlay] = useState(false);
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !playbackUrl) return;
    let hls: Hls | undefined;
    let active = true;
    setPlaybackError(''); setNeedsPlay(false);
    // MSE attachment can cancel the browser's initial autoplay request. Start
    // again after the manifest is ready, with a visible gesture fallback.
    const requestPlayback = () => {
      if (!active || document.hidden) return;
      try { void video.play()?.catch(() => { if (active) setNeedsPlay(true); }); }
      catch { if (active) setNeedsPlay(true); }
    };
    video.addEventListener('loadedmetadata', requestPlayback, {once: true});
    const fail = () => setPlaybackError(streamPlaybackError(video.error?.code === 2 ? 'networkError' : video.error?.code === 3 ? 'mediaError' : video.error?.code === 4 ? 'sourceError' : 'unknown'));
    try {
      const url = new URL(playbackUrl, window.location.origin);
      if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) {
        throw new Error('Unsupported playback URL');
      }
      const isHls = /\.m3u8$/i.test(url.pathname);
      // Safari's native HLS avoids its MSE/TS initialization stall. Chromium
      // still uses Hls.js: its canPlayType response alone is not reliable.
      const nativeSafari = isHls && Boolean(video.canPlayType('application/vnd.apple.mpegurl')) && navigator.vendor === 'Apple Computer, Inc.';
      if (nativeSafari) { video.src = url.href; }
      else if (isHls && Hls.isSupported()) {
        hls = new Hls({ maxBufferLength: 30, backBufferLength: 30 });
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) { hls?.destroy(); setPlaybackError(streamPlaybackError(data.type, data.response?.code)); }
        });
        hls.on(Hls.Events.MANIFEST_PARSED, requestPlayback);
        hls.loadSource(url.href);
        hls.attachMedia(video);
      } else if (!isHls || video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url.href;
      } else {
        setPlaybackError(streamPlaybackError('unsupported'));
      }
    } catch { fail(); }
    const pauseWhenHidden = () => { if (document.hidden) video.pause(); };
    video.addEventListener('error', fail);
    document.addEventListener('visibilitychange', pauseWhenHidden);
    return () => {
      active = false;
      video.removeEventListener('loadedmetadata', requestPlayback);
      document.removeEventListener('visibilitychange', pauseWhenHidden);
      video.removeEventListener('error', fail);
      hls?.destroy();
      video.pause();
      video.removeAttribute('src');
      video.load();
    };
  }, [playbackUrl, attempt]);

  if (!playbackUrl) {
    return (
      <div className="clipt-stream-player grid grid-cols-1 lg:grid-cols-4 gap-4"><Card className="gaming-card aspect-video w-full lg:col-span-3 flex items-center justify-center p-6 text-center">
        <div className="space-y-3"><p role={privatePlayback.isError?'alert':'status'} className="text-purple-200">{privateStream&&!user?'Sign in to watch this private beta broadcast.':privatePlayback.isError?'Authorized live playback could not be loaded.':isLive ? 'The broadcast is live, but playback is not available yet.' : offlineMessage}</p>{privatePlayback.isError&&<Button variant="outline" onClick={()=>void privatePlayback.refetch()}>Retry authorized playback</Button>}</div>
      </Card><div className="lg:col-span-1"><StreamChat streamId={streamId} isLive={isLive} /></div></div>
    );
  }

  return (
    <div className={`clipt-stream-player grid grid-cols-1 ${compact ? '' : 'lg:grid-cols-4'} gap-4 min-w-0`}>
      <div className={`${compact ? '' : 'lg:col-span-3'} space-y-4 min-w-0`}>
        <Card className="gaming-card p-4">
          <div className="aspect-video relative bg-gray-900">
            <video
              ref={videoRef}
              aria-label={title}
              className="w-full h-full"
              autoPlay
              playsInline
              controls
              muted
              onPlaying={() => {setPlaybackError('');setNeedsPlay(false);}}
            />
          </div>
          {needsPlay && !playbackError && <Button onClick={() => {
            const video=videoRef.current;if(!video)return;
            void video.play().then(()=>setNeedsPlay(false)).catch(()=>setPlaybackError('Playback could not start. Please retry.'));
          }}>Play live stream</Button>}
          {playbackError && <div className="space-y-2 p-2">
            <p role="alert">{playbackError}</p>
            <Button variant="outline" onClick={() => setAttempt(value => value + 1)}>Retry playback</Button>
          </div>}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-xl font-bold break-words [overflow-wrap:anywhere]">{title}</h2>
              <p className="text-sm text-muted-foreground">
                {viewerCount == null ? 'Viewer count unavailable' : `${viewerCount.toLocaleString()} ${viewerCount === 1 ? 'viewer' : 'viewers'}`}
              </p>
            </div>
            {showHealth && <StreamHealthIndicator streamId={streamId} />}
          </div>
        </Card>
      </div>
      <div className={compact ? 'min-w-0' : 'lg:col-span-1'}>
        <StreamChat streamId={streamId} isLive={isLive} />
      </div>
    </div>
  );
};
