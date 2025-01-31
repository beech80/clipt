import React from 'react';
import { Card } from '@/components/ui/card';
import GameBoyControls from '@/components/GameBoyControls';

const StreamingGuide = () => {
  return (
    <div className="container mx-auto p-4 pb-[200px]">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-4">Streaming Guide</h1>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Getting Started</h2>
          <p className="text-muted-foreground">
            Learn how to start streaming on our platform with this comprehensive guide.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Stream Setup</h2>
          <div className="space-y-3">
            <h3 className="font-medium">1. Stream Key and URL</h3>
            <p className="text-muted-foreground">
              Find your unique stream key in the streaming dashboard. Keep this private and never share it.
            </p>

            <h3 className="font-medium">2. Streaming Software</h3>
            <p className="text-muted-foreground">
              We recommend using OBS Studio or Streamlabs for broadcasting. Configure your software using your stream key and URL.
            </p>

            <h3 className="font-medium">3. Quality Settings</h3>
            <p className="text-muted-foreground">
              Recommended settings:
            </p>
            <ul className="list-disc list-inside text-muted-foreground ml-4">
              <li>Resolution: 1080p (1920x1080) or 720p (1280x720)</li>
              <li>Bitrate: 4000-6000 Kbps for 1080p, 2500-4000 Kbps for 720p</li>
              <li>Framerate: 30 or 60 fps</li>
              <li>Keyframe Interval: 2 seconds</li>
            </ul>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Stream Features</h2>
          <div className="space-y-3">
            <h3 className="font-medium">Chat Integration</h3>
            <p className="text-muted-foreground">
              Interact with your viewers through our real-time chat system. Moderate chat with built-in tools.
            </p>

            <h3 className="font-medium">Stream Alerts</h3>
            <p className="text-muted-foreground">
              Customize alerts for follows, subscriptions, and donations to enhance viewer engagement.
            </p>

            <h3 className="font-medium">Analytics</h3>
            <p className="text-muted-foreground">
              Track your stream performance with detailed analytics including viewer count, chat activity, and engagement metrics.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Best Practices</h2>
          <ul className="list-disc list-inside text-muted-foreground ml-4">
            <li>Test your stream setup before going live</li>
            <li>Ensure stable internet connection</li>
            <li>Monitor your stream health</li>
            <li>Engage with your chat regularly</li>
            <li>Create a consistent streaming schedule</li>
          </ul>
        </section>
      </Card>

      <GameBoyControls />
    </div>
  );
};

export default StreamingGuide;