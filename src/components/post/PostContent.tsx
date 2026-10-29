import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Gamepad2, ChevronLeft, ChevronRight } from 'lucide-react';
import PhotoCollage from './PhotoCollage';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { usePrivateMediaUrl, usePrivateMediaUrls } from '@/hooks/usePrivateMedia';
import { postImageReferences } from '@/lib/post-image-references';

interface PostContentProps {
  imageUrl?: string | null;
  videoUrl?: string | null;
  postId: string;
  frameAspectRatio?: string;
  allowFullscreen?: boolean;
  active?: boolean;
  autoPlay?: boolean;
}

const PostContent = ({ imageUrl, videoUrl, postId, frameAspectRatio, allowFullscreen = true, active = true, autoPlay = false }: PostContentProps) => {
  const lastVideoTime = useRef(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const photoTriggerRef = useRef<HTMLButtonElement>(null);
  const playingSource = useRef<{ postId: string; source: string | null | undefined; reference: string | null | undefined } | null>(null);
  const { data: rendition } = useQuery({
    queryKey: ['post-video-rendition', postId, videoUrl],
    enabled: !!videoUrl && !!postId,
    staleTime: 300_000,
    retry: 1,
    queryFn: async ({ signal }) => {
      const { data, error } = await supabase.from('post_video_renditions')
        .select('playback_url').eq('post_id', postId).eq('source_url', videoUrl!)
        .abortSignal(signal).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  // Optional rendition discovery must neither delay nor interrupt original playback.
  const locked = playingSource.current;
  const playbackReference = locked?.postId === postId && locked.source === videoUrl
    ? locked.reference : rendition?.playback_url || videoUrl;
  const videoAccess = usePrivateMediaUrl(playbackReference, false);
  const playbackUrl = videoAccess.src;
  const [isMediaLoaded, setIsMediaLoaded] = useState(false);
  const [isMediaError, setIsMediaError] = useState(false);
  const [videoErrorCode, setVideoErrorCode] = useState<number | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [hasMultipleImages, setHasMultipleImages] = useState(false);
  const [showFullscreenGallery, setShowFullscreenGallery] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [mediaRetryRevision, setMediaRetryRevision] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [slowVideo, setSlowVideo] = useState(false);
  const imageAccess = usePrivateMediaUrls(videoUrl ? [] : imageUrls);
  const imageSources = imageAccess.map(image => image.src ?? '');
  const imageSourceKey = imageSources.join('|');
  useEffect(() => {
    const urls = postImageReferences(imageUrl);
    setImageUrls(urls);
    setHasMultipleImages(urls.length > 1);
    setCurrentImageIndex(0);
    setShowFullscreenGallery(false);
    setIsMediaLoaded(false);
    setIsMediaError(false);
    setVideoErrorCode(null);
    lastVideoTime.current = 0;
  }, [postId, imageUrl, playbackReference]);

  // A renewed signed URL can recover an expired/network-failed source. Do not
  // leave its old error latched, or reset the saved playback position.
  useEffect(() => {
    setIsMediaLoaded(false);
    setIsMediaError(false);
    setVideoErrorCode(null);
    setIsVideoPlaying(false);
  }, [playbackUrl, mediaRetryRevision]);

  useEffect(() => {
    setIsMediaLoaded(false);
    setIsMediaError(false);
  }, [imageSourceKey]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let disposed = false;
    let started = false;
    const pause = () => { if (document.hidden) video.pause(); };
    const observer = new IntersectionObserver(entries => {
      const visible = entries[0].intersectionRatio >= 0.7;
      if (!visible || !active || document.hidden) { video.pause(); return; }
      if (autoPlay && !started) {
        started = true;
        video.muted = true;
        // A denied autoplay stays recoverable through the explicit Play gesture.
        void video.play().catch(() => { if (!disposed) setIsVideoPlaying(false); });
      }
    }, { threshold: [0, 0.7, 1] });
    observer.observe(video);
    document.addEventListener('visibilitychange', pause);
    return () => { disposed = true; observer.disconnect(); document.removeEventListener('visibilitychange', pause); video.pause(); };
  }, [playbackUrl, mediaRetryRevision, isMediaError, active, autoPlay]);

  useEffect(() => {
    setSlowVideo(false);
    if (!videoUrl || !playbackUrl || isMediaLoaded || isMediaError || videoAccess.error) return;
    const timer = window.setTimeout(() => setSlowVideo(true), 15_000);
    return () => window.clearTimeout(timer);
  }, [videoUrl, playbackUrl, mediaRetryRevision, isMediaLoaded, isMediaError, videoAccess.error]);

  function playVideo() {
    const video = videoRef.current;
    if (!video || !active) return;
    // Keep play() directly inside the click handler for Safari's user gesture.
    void video.play().catch(() => setIsVideoPlaying(false));
  }

  const handleMediaLoad = () => {
    setIsMediaLoaded(true);
    setIsMediaError(false);
    setSlowVideo(false);
  };

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const target = e.currentTarget;
    // Native error text can include a signed media URL; log only the safe code.
    console.error("Video playback failed. Code:", target.error?.code);
    
    setVideoErrorCode(target.error?.code ?? null);
    setIsMediaError(true);
    setIsMediaLoaded(false);
  };

  const handleImageError = () => {
    console.error("Image failed to load");
    setIsMediaError(true);
    setIsMediaLoaded(false);
  };

  const goToPreviousImage = () => {
    setIsMediaError(false);
    setIsMediaLoaded(false);
    setCurrentImageIndex(prevIndex => 
      prevIndex === 0 ? imageUrls.length - 1 : prevIndex - 1
    );
  };

  const goToNextImage = () => {
    setIsMediaError(false);
    setIsMediaLoaded(false);
    setCurrentImageIndex(prevIndex => 
      prevIndex === imageUrls.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handleCollageImageClick = (index: number) => {
    setCurrentImageIndex(index);
    setShowFullscreenGallery(true);
  };

  async function retryMedia() {
    if (retrying) return;
    setRetrying(true);
    try {
      const results = videoUrl ? [await videoAccess.retry()] : await Promise.all(imageAccess.map(image => image.retry()));
      if (results.every(result => !result.isError)) {
        setIsMediaError(false); setIsMediaLoaded(false); setVideoErrorCode(null);
        // Access refresh may return the same URL (especially public media).
        // Remount the failed element so retry actually starts a new load.
        setMediaRetryRevision(revision => revision + 1);
      }
    } finally { setRetrying(false); }
  }

  if (!videoUrl && imageAccess.some(image => image.error)) return <div role="alert" className="aspect-video bg-gray-900 p-4 text-center">
    <p>Media access is unavailable. No private URL has been substituted.</p>
    <button type="button" disabled={retrying} onClick={() => void retryMedia()} className="mt-3 rounded bg-purple-700 px-3 py-2">Retry media</button>
  </div>;
  if (!videoUrl && imageAccess.some(image => image.isLoading)) return <div role="status" className="flex aspect-video items-center justify-center bg-gray-900">Loading media…</div>;

  if (!imageUrl && !videoUrl && imageUrls.length === 0) {
    return (
      <div className="w-full aspect-video bg-gray-900 flex items-center justify-center">
        <Gamepad2 className="h-12 w-12 text-gray-700" />
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Media Content */}
      {videoUrl ? (
        <div className="clipt-video-frame w-full aspect-video bg-black relative" style={frameAspectRatio ? { aspectRatio: frameAspectRatio } : undefined}>
          {isMediaError || videoAccess.error ? (
            <div className="absolute inset-0 flex items-center justify-center text-red-500">
              <div className="text-center p-4" role="alert">
                <p>{videoAccess.error ? 'Media access is unavailable.' : videoErrorCode === 4 ? 'This video format is not supported by your browser.' : 'Unable to play video.'}</p>
                {videoErrorCode === 4 && <p className="mt-2 text-sm text-gray-300">The clip needs a compatible video rendition. Retrying may not resolve a codec issue.</p>}
                <button 
                  type="button" disabled={retrying || videoAccess.isFetching}
                  onClick={() => void retryMedia()}
                  className="mt-2 px-2 py-1 bg-purple-700 rounded text-white text-xs"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <>
              {!isMediaLoaded && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div role="status" className="animate-pulse">Loading video...</div>
                </div>
              )}
              {!videoAccess.isLoading && playbackUrl && <video
                key={postId + ":" + playbackUrl + ":" + mediaRetryRevision}
                ref={videoRef}
                src={playbackUrl || undefined}
                className="w-full h-full object-contain"
                controls
                playsInline
                muted={autoPlay}
                loop={autoPlay}
                onPlay={() => {
                  if (!active || document.hidden) { videoRef.current?.pause(); return; }
                  setIsVideoPlaying(true);
                  playingSource.current = { postId, source: videoUrl, reference: playbackReference };
                  document.querySelectorAll('video').forEach(video => { if (video !== videoRef.current) video.pause(); });
                }}
                preload={autoPlay && active ? "auto" : "metadata"}
                onPause={() => setIsVideoPlaying(false)}
                onEnded={() => setIsVideoPlaying(false)}
                onPlaying={() => { setIsVideoPlaying(true); handleMediaLoad(); }}
                onCanPlay={handleMediaLoad}
                onLoadedData={handleMediaLoad}
                onTimeUpdate={event => { if (event.currentTarget.readyState >= 2 && event.currentTarget.currentTime > 0) { lastVideoTime.current = event.currentTarget.currentTime; handleMediaLoad(); } }}
                onLoadedMetadata={event => {
                  const video = event.currentTarget;
                  if (video.videoWidth > 0 && video.videoHeight > 0) handleMediaLoad();
                  if (lastVideoTime.current > 0 && Number.isFinite(video.duration)) video.currentTime = Math.min(lastVideoTime.current, Math.max(0, video.duration - 0.05));
                }}
                onError={handleVideoError}
                onContextMenu={(e) => e.preventDefault()}
              />}
              {active && playbackUrl && !videoAccess.isLoading && !isVideoPlaying && <button type="button" aria-label="Play video"
                onClick={playVideo} className="absolute left-1/2 top-1/2 z-10 min-h-11 min-w-11 -translate-x-1/2 -translate-y-1/2 rounded-full border border-purple-300 bg-black/80 px-5 py-3 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-200">Play video</button>}
              {slowVideo && active && <div role="status" className="absolute inset-x-2 top-2 z-10 rounded bg-black/90 p-2 text-center text-white">
                <p>Video is taking longer to load. Tap Play video, or retry.</p>
                <button type="button" disabled={retrying} onClick={() => void retryMedia()} className="min-h-11 px-3 underline">Retry video</button>
              </div>}
            </>
          )}
        </div>
      ) : imageUrls.length > 0 ? (
        showFullscreenGallery && allowFullscreen ? (
          // Full-screen gallery view for when an image is clicked
          <Dialog open={showFullscreenGallery} onOpenChange={setShowFullscreenGallery}>
          <DialogContent className="clipt-media-gallery flex flex-col bg-black/95" onCloseAutoFocus={event => {
            if (photoTriggerRef.current) { event.preventDefault(); photoTriggerRef.current.focus(); }
          }} onKeyDown={event => {
            if (imageUrls.length < 2 || event.altKey || event.ctrlKey || event.metaKey) return;
            if (event.key === 'ArrowLeft') { event.preventDefault(); event.stopPropagation(); goToPreviousImage(); }
            if (event.key === 'ArrowRight') { event.preventDefault(); event.stopPropagation(); goToNextImage(); }
          }}>
            <DialogTitle className="sr-only">Post image gallery</DialogTitle>
            <DialogDescription className="sr-only">View the photo. Use Escape to close; for multiple photos use the previous and next buttons or arrow keys.</DialogDescription>
            <div className="flex justify-between items-center p-4">
              <span className="text-white">{currentImageIndex + 1} / {imageUrls.length}</span>
            </div>
            <div className="clipt-gallery-stage flex-1 min-h-0 relative flex items-center justify-center">
              {isMediaError && <div role="alert" className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/90 p-4 text-center">
                <p>Unable to load this photo.</p>
                <button type="button" disabled={retrying} onClick={() => void retryMedia()} className="min-h-11 rounded bg-purple-700 px-4 py-2">{retrying ? 'Retrying…' : 'Retry media'}</button>
              </div>}
              <img
                key={imageSources[currentImageIndex] + ":" + mediaRetryRevision}
                src={imageSources[currentImageIndex]}
                alt="Post content fullscreen"
                className="h-full w-full min-h-0 object-contain mx-auto"
                onLoad={handleMediaLoad}
                onError={handleImageError}
              />
              
              {imageUrls.length > 1 && (
                <>
                  <button 
                    type="button" aria-label="Previous image"
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 rounded-full p-3"
                    onClick={goToPreviousImage}
                  >
                    <ChevronLeft className="h-8 w-8 text-white" />
                  </button>
                  
                  <button 
                    type="button" aria-label="Next image"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 rounded-full p-3"
                    onClick={goToNextImage}
                  >
                    <ChevronRight className="h-8 w-8 text-white" />
                  </button>
                </>
              )}
            </div>
          </DialogContent>
          </Dialog>
        ) : !allowFullscreen ? (
          <div className="clipt-photo-frame relative block w-full aspect-video bg-black" style={frameAspectRatio ? { aspectRatio: frameAspectRatio } : undefined}>
            <img key={imageSources[currentImageIndex] + ':' + mediaRetryRevision}
              src={imageSources[currentImageIndex]} alt={imageUrls.length > 1 ? `Post content ${currentImageIndex + 1} of ${imageUrls.length}` : 'Post content'}
              className="w-full h-full object-contain bg-black" onLoad={handleMediaLoad} onError={handleImageError} />
            {imageUrls.length > 1 && <>
              <button type="button" aria-label="Previous image" onClick={goToPreviousImage} className="absolute left-2 top-1/2 min-h-11 min-w-11 -translate-y-1/2 rounded-full bg-black/70 text-white"><ChevronLeft className="mx-auto" aria-hidden="true" /></button>
              <button type="button" aria-label="Next image" onClick={goToNextImage} className="absolute right-2 top-1/2 min-h-11 min-w-11 -translate-y-1/2 rounded-full bg-black/70 text-white"><ChevronRight className="mx-auto" aria-hidden="true" /></button>
              <span className="absolute left-1/2 bottom-2 -translate-x-1/2 rounded bg-black/70 px-2 text-white" aria-live="polite">{currentImageIndex + 1} / {imageUrls.length}</span>
            </>}
          </div>
        ) : hasMultipleImages ? (
          // Photo collage for multiple images
          <PhotoCollage 
            key={mediaRetryRevision}
            images={imageSources}
            onImageClick={handleCollageImageClick}
            onImageLoad={handleMediaLoad}
            onImageError={handleImageError}
          />
        ) : (
          // Single image view
          <button ref={photoTriggerRef} type="button" aria-label="Open post image 1 of 1" className="clipt-photo-frame block w-full aspect-video bg-black" style={frameAspectRatio ? { aspectRatio: frameAspectRatio } : undefined} onClick={() => setShowFullscreenGallery(true)}><img
            key={imageSources[0] + ":" + mediaRetryRevision}
            src={imageSources[0]}
            alt="Post content"
            className="w-full h-full object-contain bg-black"
            onLoad={handleMediaLoad}
            onError={handleImageError}
          /></button>
        )
      ) : null}

      {/* Loading Indicator */}
      {!isMediaLoaded && !isMediaError && !videoAccess.error && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/50">
          <span role="status" className="sr-only">Loading media…</span><div aria-hidden="true" className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
        </div>
      )}

      {/* Error State */}
      {isMediaError && !videoUrl && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Badge variant="destructive" className="px-3 py-1">Media unavailable</Badge>
          <button type="button" disabled={retrying} onClick={() => void retryMedia()} className="ml-3 rounded bg-purple-700 px-3 py-2">Retry media</button>
        </div>
      )}
    </div>
  );
};

export default PostContent;
