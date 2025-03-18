// Streaming configuration for Clipt
// Update these values based on your domain and server setup

export const streamingConfig = {
  // RTMP URL for streaming to the server (used by OBS and other streaming software)
  RTMP_URL: "rtmp://stream.clipt.live/live",
  
  // The base URL for the media server that serves the streams to viewers
  STREAM_SERVER_URL: "https://player.clipt.live",
  
  // The path format for playback URLs (where users can watch streams)
  // {streamId} will be replaced with the actual stream ID
  PLAYBACK_URL_FORMAT: "https://player.clipt.live/{streamId}/index.m3u8",
  
  // WebSocket URL for real-time stream events (chat, viewer count, etc.)
  WEBSOCKET_URL: "wss://stream.clipt.live/ws",
  
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

// Helper function to generate a complete RTMP URL with stream key
export const generateRtmpUrl = (streamKey: string): string => {
  return `${streamingConfig.RTMP_URL}/${streamKey}`;
};

// Helper function to generate a playback URL for a stream
export const generatePlaybackUrl = (streamId: string): string => {
  return streamingConfig.PLAYBACK_URL_FORMAT.replace('{streamId}', streamId);
};

export default streamingConfig;
