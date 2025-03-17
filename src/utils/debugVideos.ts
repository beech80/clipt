import { supabase } from '@/lib/supabase';

/**
 * Debug utility for video content issues
 * This script helps identify issues with video content in the database
 */

/**
 * Check if a video URL is accessible
 * @param url URL to check
 * @returns Promise that resolves to a boolean indicating if the URL is accessible
 */
export async function checkVideoUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    console.log(`Video URL check for ${url}: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      console.error(`Video URL check failed: ${response.status} ${response.statusText}`);
      return false;
    }
    
    // Check content type to ensure it's a video
    const contentType = response.headers.get('content-type');
    console.log(`Content-Type: ${contentType}`);
    
    if (!contentType || !contentType.includes('video/')) {
      if (contentType?.includes('text/html')) {
        console.error(`Invalid content type (probably a redirect/error page): ${contentType}`);
      } else {
        console.error(`Invalid content type for video: ${contentType}`);
      }
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Error checking video URL ${url}:`, error);
    return false;
  }
}

/**
 * Get video posts from the database for debugging
 */
export async function getVideoPostsForDebug() {
  try {
    console.log('Fetching video posts for debugging...');
    
    const { data, error } = await supabase
      .from('posts')
      .select(`
        id,
        content,
        video_url
      `)
      .not('video_url', 'is', null)
      .not('video_url', 'eq', '')
      .limit(5);
      
    if (error) {
      console.error('Error fetching video posts:', error);
      return [];
    }
    
    console.log(`Found ${data.length} video posts for debugging`);
    
    // Map through posts and check video URLs
    const checkedPosts = await Promise.all(
      data.map(async (post) => {
        const isValid = post.video_url ? await checkVideoUrl(post.video_url) : false;
        
        return {
          id: post.id,
          content: post.content || '',
          video_url: post.video_url,
          isValid
        };
      })
    );
    
    return checkedPosts;
  } catch (error) {
    console.error('Error in getVideoPostsForDebug:', error);
    return [];
  }
}

/**
 * Debug any video playback issues
 * @param videoUrl URL of the video to debug
 */
export function debugVideoElement(videoUrl: string) {
  if (!videoUrl) {
    console.error('No video URL provided for debugging');
    return;
  }
  
  console.log('Debugging video element with URL:', videoUrl);
  
  // Create a test video element to check playback
  const video = document.createElement('video');
  video.style.display = 'none';
  video.muted = true;
  video.src = videoUrl;
  
  // Listen for errors
  video.addEventListener('error', (e) => {
    console.error('Video error event:', e);
    console.error('Video error details:', video.error);
  });
  
  // Check if video can play
  video.addEventListener('canplay', () => {
    console.log('Video can play!');
    document.body.removeChild(video);
  });
  
  // Add to DOM temporarily
  document.body.appendChild(video);
  
  // Try to load the video
  try {
    video.load();
    
    // Set a timeout to report if video fails to load
    setTimeout(() => {
      if (video.readyState === 0) {
        console.error('Video failed to load after timeout');
        if (document.body.contains(video)) {
          document.body.removeChild(video);
        }
      }
    }, 5000);
  } catch (error) {
    console.error('Error loading video:', error);
    if (document.body.contains(video)) {
      document.body.removeChild(video);
    }
  }
}
