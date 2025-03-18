# Domain Setup for Clipt Streaming

## DNS Configuration for Streaming

To ensure your streaming functionality works properly with your domain, configure the following DNS records:

### Required DNS Records

1. **Main domain (example.com)**
   - A record pointing to your hosting server IP

2. **Stream subdomain (stream.example.com)**
   - A record pointing to your streaming server IP
   - This subdomain will be used for RTMP streaming ingestion

3. **Player subdomain (player.example.com)**
   - A record pointing to your media server IP where stream playback is hosted
   - This subdomain will be used for viewers to watch streams

### Example DNS Configuration

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | [Your primary server IP] | 3600 |
| A | stream | [Your streaming server IP] | 3600 |
| A | player | [Your media server IP] | 3600 |

## Streaming Server Requirements

For a full streaming setup, you'll need:

1. **RTMP Server**: Receives live streams from broadcasters
   - Nginx with RTMP module or OBS.Ninja
   - SRS (Simple RTMP Server)
   - Wowza Streaming Engine

2. **Media Server**: Transforms RTMP to HLS/DASH for playback
   - Configured to receive RTMP and output HTTP-based formats

3. **SSL Certificates**: Required for secure streaming
   - Let's Encrypt certificates for all subdomains
   - Configure SSL termination on all servers

## Testing Your Setup

1. Use OBS Studio or similar broadcasting software
2. Configure with your RTMP URL: `rtmp://stream.yourdomain.com/live`
3. Use your stream key from the dashboard
4. Start streaming
5. Verify playback at: `https://player.yourdomain.com/[stream-name]`

## Troubleshooting

- **554 Connection Error**: Check firewall settings (TCP port 1935 needs to be open)
- **Stream Not Visible**: Verify media server transcoding settings
- **High Latency**: Adjust chunking and buffer settings on your media server

For assistance with server setup and configuration, contact your hosting provider or consider using a managed streaming service like AWS IVS, Mux, or LivePeer.
