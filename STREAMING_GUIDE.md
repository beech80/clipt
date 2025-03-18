# Clipt Streaming Guide

## Setting Up Streaming with Your Own Domain

This guide will help you set up and configure streaming on your domain for Clipt.

## Prerequisites

1. **Domain Registration**: You need a registered domain (e.g., clipt.live)
2. **Server Infrastructure**: 
   - Web server for the Clipt application
   - RTMP server for receiving streams
   - Media server for processing and delivering streams

## Server Requirements

For smooth streaming performance, your server should have:
- 4+ CPU cores
- 8GB+ RAM
- 100Mbps+ upload bandwidth
- SSD storage

## Installation Steps

### 1. Set Up Media Server

We recommend using [OBS.Ninja](https://obs.ninja/) (now [VDO.Ninja](https://vdo.ninja/)) or NGINX with RTMP module:

#### Using NGINX with RTMP

```bash
# Install NGINX with RTMP module
sudo apt update
sudo apt install build-essential libpcre3-dev libssl-dev
sudo apt install nginx libnginx-mod-rtmp

# Configure NGINX
sudo nano /etc/nginx/nginx.conf
```

Add this to your nginx.conf:

```
rtmp {
    server {
        listen 1935;
        chunk_size 4096;
        
        application live {
            live on;
            record off;
            
            # Convert RTMP to HLS
            hls on;
            hls_path /var/www/html/hls;
            hls_fragment 3;
            hls_playlist_length 60;
            
            # Allow publishing only from specific IPs (optional)
            # allow publish 127.0.0.1;
            # deny publish all;
            
            # Allow everyone to play the stream
            allow play all;
        }
    }
}
```

```bash
# Create HLS directory
sudo mkdir -p /var/www/html/hls
sudo chown -R www-data:www-data /var/www/html/hls

# Restart NGINX
sudo systemctl restart nginx
```

#### Configure SSL

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificates
sudo certbot --nginx -d stream.yourdomain.com -d player.yourdomain.com
```

### 2. Update Clipt Configuration

Update the streaming configuration in your codebase:

1. Open `src/config/streamingConfig.ts`
2. Update the URLs to match your domain:
   - `RTMP_URL`: `rtmp://stream.yourdomain.com/live`
   - `STREAM_SERVER_URL`: `https://player.yourdomain.com`
   - `PLAYBACK_URL_FORMAT`: `https://player.yourdomain.com/{streamId}/index.m3u8`
   - `WEBSOCKET_URL`: `wss://stream.yourdomain.com/ws`

### 3. Firewall Configuration

Make sure these ports are open on your server:
- 1935/tcp (RTMP)
- 80/tcp (HTTP)
- 443/tcp (HTTPS)
- 8080/tcp (Alternative HTTP, if needed)

```bash
# Open ports using UFW
sudo ufw allow 1935/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

## Broadcasting Instructions (For Streamers)

### Using OBS Studio

1. Open OBS Studio
2. Go to Settings > Stream
3. Select "Custom..." for Service
4. Enter the following:
   - Server: `rtmp://stream.yourdomain.com/live`
   - Stream Key: (Your stream key from Clipt dashboard)
5. Set up your scenes, sources, and audio
6. Click "Start Streaming"

### Using Streamlabs OBS

1. Open Streamlabs OBS
2. Go to Settings > Stream
3. Select "Custom" for Service
4. Enter the following:
   - Server: `rtmp://stream.yourdomain.com/live`
   - Stream Key: (Your stream key from Clipt dashboard)
5. Set up your scenes, sources, and audio
6. Click "Go Live"

## Recommended Stream Settings

### Video
- Resolution: 1280x720 (720p) or 1920x1080 (1080p)
- Framerate: 30 or 60 fps
- Keyframe Interval: 2 seconds
- Bitrate: 
  - 720p30: 2,500-4,000 Kbps
  - 720p60: 3,500-5,000 Kbps
  - 1080p30: 4,500-6,000 Kbps
  - 1080p60: 6,000-9,000 Kbps

### Audio
- Bitrate: 128-320 Kbps
- Sample Rate: 48 kHz
- Channels: Stereo

## Troubleshooting

### Stream Not Connecting
1. Verify that your RTMP URL and stream key are correct
2. Check that port 1935 is open on your server
3. Try restarting your broadcasting software
4. Check your server logs: `sudo tail -f /var/log/nginx/error.log`

### Poor Stream Quality
1. Check your upload bandwidth at [Speedtest.net](https://www.speedtest.net/)
2. Lower your bitrate in OBS settings
3. Reduce your resolution or framerate
4. Close other applications using your network

### High Latency
1. Reduce HLS fragment size in nginx.conf (e.g., from 3 to 2)
2. Enable low latency HLS in nginx.conf
3. Consider using WebRTC for ultra-low latency (requires different setup)

## Support

If you encounter any issues, please contact support@clipt.live or open an issue on our GitHub repository.

---

Happy streaming! 🎮🎬
