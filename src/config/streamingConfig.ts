// Streaming configuration for Clipt with Cloudflare Stream
// Update these values based on your Cloudflare account setup

export const streamingConfig = {
  // RTMP URL for streaming to Cloudflare (used by OBS and other streaming software)
  // Replace ACCOUNT_HASH and STREAM_KEY with your actual Cloudflare account hash and stream key
  RTMP_URL: "rtmp://live.cloudflare.com/live",
  
  // The base URL for the Cloudflare Stream server that serves the streams to viewers
  STREAM_SERVER_URL: "https://videodelivery.net",
  
  // The path format for playback URLs (where users can watch streams)
  // {streamId} will be replaced with the actual Cloudflare Stream ID/UID
  PLAYBACK_URL_FORMAT: "https://videodelivery.net/{streamId}/manifest/video.m3u8",
  
  // WebSocket URL for real-time stream events (chat, viewer count, etc.)
  WEBSOCKET_URL: "wss://realtime.videodelivery.net/ws",
  
  // Default streaming settings
  DEFAULT_SETTINGS: {
    // Video settings
    VIDEO: {
      RESOLUTION: "720p", // Options: 480p, 720p, 1080p
      BITRATE: "2500kbps", // Recommended bitrate
      FRAMERATE: 30, // Recommended framerate
    },
    // Audio settings
    AUDIO: {
      BITRATE: "128kbps", // Recommended audio bitrate
      SAMPLE_RATE: 48000, // Recommended sample rate
    }
  },
  
  // Feature flags
  FEATURES: {
    ENABLE_LOW_LATENCY: true,
    ENABLE_DVR: true,
    ENABLE_CHAT: true,
    ENABLE_STREAM_ANALYTICS: true,
  }
};

// Helper function to generate a complete RTMP URL with Cloudflare stream key
export const generateRtmpUrl = (streamKey: string): string => {
  // For Cloudflare, the format is rtmp://live.cloudflare.com/live/STREAM_KEY
  // The streamKey should be in format: ACCOUNT_HASH/STREAM_KEY
  return `${streamingConfig.RTMP_URL}/${streamKey}`;
};

// Helper function to generate a playback URL for a stream using Cloudflare Stream
export const generatePlaybackUrl = (streamId: string): string => {
  // Check if streamId is a valid Cloudflare Stream ID (typically 32+ characters)
  if (streamId && streamId.length >= 32) {
    return streamingConfig.PLAYBACK_URL_FORMAT.replace('{streamId}', streamId);
  }
  
  // Fallback for development or if streamId doesn't look like a Cloudflare Stream ID
  console.warn('Invalid or non-Cloudflare Stream ID provided:', streamId);
  return `${streamingConfig.STREAM_SERVER_URL}/fallback.m3u8`;
};

export default streamingConfig;
