import { supabase } from '@/supabaseClient';

interface StreamOptions {
  maxDurationSeconds?: number;
  requireSignedURLs?: boolean;
  allowedOrigins?: string[];
}

interface StreamResponse {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Service to handle Cloudflare Stream operations
 */
class CloudflareStreamService {
  private readonly accountId: string;
  private readonly apiToken: string;
  private readonly streamUrl: string;
  private readonly apiBase: string;

  constructor() {
    this.accountId = import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID;
    this.apiToken = import.meta.env.VITE_CLOUDFLARE_API_TOKEN;
    this.streamUrl = import.meta.env.VITE_CLOUDFLARE_STREAM_URL;
    
    // Validate required environment variables
    if (!this.accountId || !this.apiToken) {
      console.error('Cloudflare Stream credentials missing. Streaming functionality will not work.');
    }
    
    this.apiBase = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/stream`;
  }

  /**
   * Create a direct upload URL for the user
   * @param options Stream options
   * @returns Response with upload URL and other data
   */
  public async createDirectUpload(options: StreamOptions = {}): Promise<StreamResponse> {
    try {
      // Make sure user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }
      
      // Check if network is available
      if (!navigator.onLine) {
        return { success: false, error: 'No internet connection available' };
      }

      const response = await fetch(`${this.apiBase}/direct_upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          maxDurationSeconds: options.maxDurationSeconds || 3600, // Default 1 hour
          requireSignedURLs: options.requireSignedURLs || false,
          allowedOrigins: options.allowedOrigins || ['*'],
          creator: user.id,
          meta: {
            userId: user.id,
            createdAt: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Cloudflare Stream direct upload error:', error);
        return { 
          success: false, 
          error: error.errors?.[0]?.message || 'Failed to create upload URL' 
        };
      }

      const data = await response.json();
      return { success: true, data: data.result };
    } catch (error) {
      console.error('Cloudflare Stream service error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      };
    }
  }

  /**
   * Get stream details by ID
   * @param videoId Stream video ID
   * @returns Stream video information
   */
  public async getStream(videoId: string): Promise<StreamResponse> {
    try {
      if (!videoId) {
        return { success: false, error: 'Video ID is required' };
      }
      
      // Check if network is available
      if (!navigator.onLine) {
        return { success: false, error: 'No internet connection available' };
      }

      const response = await fetch(`${this.apiBase}/${videoId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        return { 
          success: false, 
          error: error.errors?.[0]?.message || 'Failed to fetch stream information' 
        };
      }

      const data = await response.json();
      return { success: true, data: data.result };
    } catch (error) {
      console.error('Failed to get stream details:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      };
    }
  }

  /**
   * Get a signed playback URL for a video
   * @param videoId Stream video ID
   * @param expirationTime Expiration time in seconds from now
   * @returns Signed playback URL
   */
  public async getSignedPlaybackUrl(videoId: string, expirationTime = 3600): Promise<StreamResponse> {
    try {
      if (!videoId) {
        return { success: false, error: 'Video ID is required' };
      }

      // Check if network is available
      if (!navigator.onLine) {
        return { success: false, error: 'No internet connection available' };
      }

      const response = await fetch(`${this.apiBase}/${videoId}/token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          exp: Math.floor(Date.now() / 1000) + expirationTime
        })
      });

      if (!response.ok) {
        const error = await response.json();
        return { 
          success: false, 
          error: error.errors?.[0]?.message || 'Failed to generate signed URL' 
        };
      }

      const data = await response.json();
      const token = data.result.token;
      
      // Construct the signed URL
      const signedUrl = `${this.streamUrl}/${videoId}/${token}`;
      return { success: true, data: { signedUrl } };
    } catch (error) {
      console.error('Failed to get signed playback URL:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      };
    }
  }

  /**
   * Delete a video from Cloudflare Stream
   * @param videoId Stream video ID
   * @returns Success or error
   */
  public async deleteVideo(videoId: string): Promise<StreamResponse> {
    try {
      // Make sure user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }
      
      if (!videoId) {
        return { success: false, error: 'Video ID is required' };
      }

      // Check if network is available
      if (!navigator.onLine) {
        return { success: false, error: 'No internet connection available' };
      }

      // First get the video to check if this user has permission
      const videoResponse = await this.getStream(videoId);
      if (!videoResponse.success) {
        return videoResponse;
      }
      
      // Check if the current user is the creator of the video
      // You can modify this according to your permission logic
      if (videoResponse.data?.meta?.userId && videoResponse.data.meta.userId !== user.id) {
        return { success: false, error: 'You do not have permission to delete this video' };
      }

      const response = await fetch(`${this.apiBase}/${videoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        return { 
          success: false, 
          error: error.errors?.[0]?.message || 'Failed to delete video' 
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to delete video:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      };
    }
  }

  /**
   * List all videos for the current user
   * @returns List of videos
   */
  public async listVideos(): Promise<StreamResponse> {
    try {
      // Make sure user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Check if network is available
      if (!navigator.onLine) {
        return { success: false, error: 'No internet connection available' };
      }

      const response = await fetch(`${this.apiBase}?creator=${user.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        return { 
          success: false, 
          error: error.errors?.[0]?.message || 'Failed to list videos' 
        };
      }

      const data = await response.json();
      return { success: true, data: data.result };
    } catch (error) {
      console.error('Failed to list videos:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      };
    }
  }

  /**
   * Get the HLS URL for streaming a video
   * @param videoId Stream video ID
   * @returns HLS URL for the video
   */
  public getStreamUrl(videoId: string): string {
    if (!videoId) {
      console.error('Video ID is required');
      return '';
    }
    return `${this.streamUrl}/${videoId}/manifest/video.m3u8`;
  }

  /**
   * Get the thumbnail URL for a video
   * @param videoId Stream video ID
   * @returns Thumbnail URL
   */
  public getThumbnailUrl(videoId: string): string {
    if (!videoId) {
      console.error('Video ID is required');
      return '';
    }
    return `${this.streamUrl}/${videoId}/thumbnails/thumbnail.jpg`;
  }
}

export const cloudflareStreamService = new CloudflareStreamService();
