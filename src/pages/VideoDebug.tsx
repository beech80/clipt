import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { getVideoPostsForDebug, debugVideoElement } from '@/utils/debugVideos';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface VideoDebugInfo {
  id: string;
  content: string;
  video_url: string;
  isValid: boolean;
}

const VideoDebug = () => {
  const [debugPosts, setDebugPosts] = useState<VideoDebugInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [customUrl, setCustomUrl] = useState('');
  const [validationResult, setValidationResult] = useState<{status: string, message: string} | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Fetch posts when component mounts
  useEffect(() => {
    const fetchDebugData = async () => {
      try {
        setIsLoading(true);
        const debugData = await getVideoPostsForDebug();
        setDebugPosts(debugData);
      } catch (error) {
        console.error('Error fetching debug data:', error);
        toast.error('Failed to fetch video posts for debugging');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDebugData();
  }, []);

  // Track user interaction to help with autoplay
  useEffect(() => {
    const triggerInteraction = () => {
      document.documentElement.setAttribute('data-user-interacted', 'true');
      console.log('User interaction recorded, videos can now autoplay with sound');
    };

    // Add interaction listeners
    document.addEventListener('click', triggerInteraction, { once: true });
    document.addEventListener('touchstart', triggerInteraction, { once: true });
    
    return () => {
      document.removeEventListener('click', triggerInteraction);
      document.removeEventListener('touchstart', triggerInteraction);
    };
  }, []);

  // Test a custom video URL
  const testCustomUrl = async () => {
    if (!customUrl) {
      setValidationResult({
        status: 'error',
        message: 'Please enter a URL to test'
      });
      return;
    }

    setValidationResult({
      status: 'loading',
      message: 'Testing URL...'
    });

    try {
      // Test if the URL is valid
      const url = new URL(customUrl);
      
      // Try to fetch headers
      try {
        const response = await fetch(customUrl, { method: 'HEAD' });
        const contentType = response.headers.get('content-type');
        
        // Test with debug video element
        debugVideoElement(customUrl);
        
        if (contentType?.includes('video/')) {
          setValidationResult({
            status: 'success',
            message: `Success! Content-Type: ${contentType}`
          });
        } else {
          setValidationResult({
            status: 'warning',
            message: `URL accessible but not a video type: ${contentType}`
          });
        }
      } catch (error) {
        console.error('Error fetching URL:', error);
        setValidationResult({
          status: 'error',
          message: `Error fetching URL: ${error instanceof Error ? error.message : String(error)}`
        });
      }
    } catch (error) {
      setValidationResult({
        status: 'error',
        message: 'Invalid URL format'
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <BackButton />
      <h1 className="text-2xl font-bold mb-6">Video Debug Tool</h1>
      
      {/* Custom URL tester */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Test Custom Video URL</CardTitle>
          <CardDescription>Enter a video URL to test its playback and content type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input 
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="Enter video URL to test"
              className="flex-1"
            />
            <Button onClick={testCustomUrl}>Test URL</Button>
          </div>
          
          {validationResult && (
            <div className={`mt-4 p-3 rounded ${
              validationResult.status === 'success' 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                : validationResult.status === 'warning'
                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
            }`}>
              {validationResult.message}
            </div>
          )}
          
          {customUrl && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Video Preview:</h3>
              <div className="relative aspect-video bg-black/10 rounded overflow-hidden">
                <video
                  ref={videoRef}
                  src={customUrl}
                  className="w-full h-full object-contain"
                  controls
                  playsInline
                  preload="auto"
                  onError={(e) => {
                    console.error("Video error:", (e.target as HTMLVideoElement).error);
                    setValidationResult({
                      status: 'error',
                      message: `Playback error: ${(e.target as HTMLVideoElement).error?.message || 'Unknown error'}`
                    });
                  }}
                  onLoadedData={() => {
                    setValidationResult(prev => prev ? {
                      ...prev,
                      status: 'success',
                      message: prev.message + ' - Video loaded successfully!'
                    } : {
                      status: 'success',
                      message: 'Video loaded successfully!'
                    });
                  }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Debug posts from database */}
      <h2 className="text-xl font-bold mb-4">Video Posts from Database</h2>
      {isLoading ? (
        <p>Loading video posts...</p>
      ) : debugPosts.length === 0 ? (
        <p>No video posts found in the database</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {debugPosts.map(post => (
            <Card key={post.id} className={post.isValid ? 'border-green-500/50' : 'border-red-500/50'}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Post ID: {post.id.substring(0, 8)}...
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                    post.isValid 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                  }`}>
                    {post.isValid ? 'Valid' : 'Invalid'}
                  </span>
                </CardTitle>
                <CardDescription className="break-all">{post.video_url}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-video bg-black/10 rounded overflow-hidden">
                  <video
                    src={post.video_url}
                    className="w-full h-full object-contain"
                    controls
                    playsInline
                    preload="auto"
                    onError={(e) => {
                      console.error(`Error loading video for post ${post.id}:`, (e.target as HTMLVideoElement).error);
                    }}
                  />
                </div>
                {post.content && (
                  <p className="mt-2 text-sm text-muted-foreground">{post.content}</p>
                )}
              </CardContent>
              <CardFooter>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => {
                    debugVideoElement(post.video_url);
                    toast.info(`Debugging video for post ${post.id}`);
                  }}>
                    Debug Video
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    // Try to play with a modified URL
                    const modifiedUrl = post.video_url.includes('?') 
                      ? `${post.video_url}&t=${Date.now()}`
                      : `${post.video_url}?t=${Date.now()}`;
                    
                    // Create a test video
                    const video = document.createElement('video');
                    video.src = modifiedUrl;
                    video.muted = true;
                    video.autoplay = true;
                    
                    // Log and remove after attempt
                    video.onloadeddata = () => {
                      toast.success(`Modified URL works for post ${post.id}`);
                      document.body.removeChild(video);
                    };
                    
                    video.onerror = () => {
                      toast.error(`Modified URL still fails for post ${post.id}`);
                      document.body.removeChild(video);
                    };
                    
                    // Add to DOM temporarily
                    video.style.display = 'none';
                    document.body.appendChild(video);
                  }}>
                    Try Modified URL
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoDebug;
