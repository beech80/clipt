import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { toast } from 'sonner';
import { Video, Link, Copy, Clipboard, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Separator } from './ui/separator';
import { supabase } from '@/supabaseClient';
import { useUser } from '@/hooks/useUser';
import { cloudflareStreamService } from '@/services/cloudflareStreamService';
import { v4 as uuidv4 } from 'uuid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface LiveStreamSetupProps {
  onStreamCreated?: (streamId: string) => void;
  className?: string;
}

const LiveStreamSetup: React.FC<LiveStreamSetupProps> = ({ 
  onStreamCreated,
  className = ''
}) => {
  const { user } = useUser();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [notifyFollowers, setNotifyFollowers] = useState(true);
  const [chatEnabled, setChatEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [streamKey, setStreamKey] = useState('');
  const [rtmpUrl, setRtmpUrl] = useState('');
  const [streamId, setStreamId] = useState('');
  const [playbackUrl, setPlaybackUrl] = useState('');
  const [isStreamCreated, setIsStreamCreated] = useState(false);
  const [showStreamKey, setShowStreamKey] = useState(false);
  const [activeTab, setActiveTab] = useState('setup');

  const handleCreateStream = async (scheduled: boolean = false) => {
    if (!title) {
      toast.error('Please enter a title for your stream');
      return;
    }

    if (scheduled && !scheduledTime) {
      toast.error('Please select a scheduled time for your stream');
      return;
    }

    if (!user) {
      toast.error('You must be logged in to create a stream');
      return;
    }

    setLoading(true);
    try {
      // Generate a unique stream key
      const generatedStreamKey = uuidv4().replace(/-/g, '');
      
      // For demo purposes, we'll simulate stream creation
      // In a real implementation, you would create a live stream via Cloudflare's API
      const rtmpIngest = 'rtmp://live.cloudflare.com/live/';
      const rtmpStreamKey = `${generatedStreamKey}?account=${import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID}`;
      
      // Create a database entry for the stream
      const { data: streamData, error: streamError } = await supabase
        .from('streams')
        .insert({
          title,
          description,
          user_id: user.id,
          is_live: !scheduled,
          scheduled_start_time: scheduled ? new Date(scheduledTime).toISOString() : null,
          chat_enabled: chatEnabled,
          rtmp_url: rtmpIngest,
          rtmp_key: rtmpStreamKey,
          encrypted_stream_key: generatedStreamKey, // In production, encrypt this
          streaming_url: `${rtmpIngest}${rtmpStreamKey}`,
          playback_url: `https://customer-${import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID}.cloudflarestream.com/live/${generatedStreamKey}/manifest/video.m3u8`,
          hls_playback_url: `https://customer-${import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID}.cloudflarestream.com/live/${generatedStreamKey}/manifest/video.m3u8`,
          stream_key: generatedStreamKey,
          stream_settings: { 
            provider: 'cloudflare',
            accountId: import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID,
            lowLatency: true
          }
        })
        .select()
        .single();

      if (streamError) throw streamError;
      
      // Set state with new stream details
      setStreamKey(rtmpStreamKey);
      setRtmpUrl(rtmpIngest);
      setStreamId(streamData.id);
      setPlaybackUrl(`https://customer-${import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID}.cloudflarestream.com/live/${generatedStreamKey}/manifest/video.m3u8`);
      setIsStreamCreated(true);
      
      // If we're notifying followers and it's a scheduled stream, send push notifications
      if (notifyFollowers && scheduled) {
        sendStreamNotifications(streamData.id, scheduled);
      }
      
      // If it's not scheduled, it's going live now, so send immediate notifications
      if (notifyFollowers && !scheduled) {
        sendStreamNotifications(streamData.id, false);
      }
      
      toast.success(scheduled ? 'Stream scheduled successfully!' : 'Stream created successfully!');
      
      if (onStreamCreated) {
        onStreamCreated(streamData.id);
      }
      
      setActiveTab('details');
    } catch (error) {
      console.error('Error creating stream:', error);
      toast.error('Failed to create stream');
    } finally {
      setLoading(false);
    }
  };

  const sendStreamNotifications = async (streamId: string, scheduled: boolean) => {
    try {
      // Get user's followers
      const { data: followers } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('following_id', user?.id);
      
      if (!followers || followers.length === 0) return;
      
      const followerIds = followers.map(f => f.follower_id);
      
      // Get followers' push notification subscriptions
      const { data: subscriptions } = await supabase
        .from('push_subscriptions')
        .select('subscription, user_id')
        .in('user_id', followerIds)
        .eq('active', true);
      
      if (!subscriptions || subscriptions.length === 0) return;
      
      // Prepare the notification payload
      const notificationData = {
        title: scheduled ? 
          `${user?.user_metadata?.full_name || 'Someone'} scheduled a stream` : 
          `${user?.user_metadata?.full_name || 'Someone'} just went live!`,
        body: title,
        url: `/stream/${streamId}`,
        image: user?.user_metadata?.avatar_url,
        topic: 'stream',
        data: {
          streamId,
          userId: user?.id,
          scheduled,
          scheduledTime: scheduled ? new Date(scheduledTime).toISOString() : null
        }
      };
      
      // Send push notification through our existing push-notifications endpoint
      await fetch('/api/push-notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          subscriptions: subscriptions.map(s => s.subscription),
          notification: notificationData
        })
      });
      
      console.log(`Notifications sent to ${subscriptions.length} followers`);
    } catch (error) {
      console.error('Error sending stream notifications:', error);
    }
  };

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success(message))
      .catch(err => {
        console.error('Copy failed:', err);
        toast.error('Failed to copy to clipboard');
      });
  };

  return (
    <Card className={className}>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="setup">Setup Stream</TabsTrigger>
          <TabsTrigger value="details" disabled={!isStreamCreated}>Stream Details</TabsTrigger>
        </TabsList>
        
        <TabsContent value="setup" className="space-y-4 pt-4">
          <CardHeader className="px-6 pt-0">
            <CardTitle className="text-xl">Create Live Stream</CardTitle>
            <CardDescription>
              Set up your live stream and notify your audience
            </CardDescription>
          </CardHeader>
          
          <CardContent className="px-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Stream Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter your stream title"
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell viewers what your stream is about"
                rows={3}
                disabled={loading}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="schedule">Schedule for Later</Label>
                <p className="text-sm text-muted-foreground">
                  Set a time for your upcoming stream
                </p>
              </div>
              <Input
                id="schedule"
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                disabled={loading}
                className="w-[230px]"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notify">Notify Followers</Label>
                <p className="text-sm text-muted-foreground">
                  Send push notifications when you go live
                </p>
              </div>
              <Switch
                id="notify"
                checked={notifyFollowers}
                onCheckedChange={setNotifyFollowers}
                disabled={loading}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="chat">Enable Chat</Label>
                <p className="text-sm text-muted-foreground">
                  Allow viewers to chat during your stream
                </p>
              </div>
              <Switch
                id="chat"
                checked={chatEnabled}
                onCheckedChange={setChatEnabled}
                disabled={loading}
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex gap-2 px-6">
            <Button 
              onClick={() => handleCreateStream(false)} 
              disabled={loading || !title}
              className="flex-1"
            >
              <Video className="h-4 w-4 mr-2" />
              {loading ? 'Creating...' : 'Go Live Now'}
            </Button>
            <Button 
              onClick={() => handleCreateStream(true)} 
              variant="outline"
              disabled={loading || !title || !scheduledTime}
              className="flex-1"
            >
              <Clock className="h-4 w-4 mr-2" />
              {loading ? 'Scheduling...' : 'Schedule Stream'}
            </Button>
          </CardFooter>
        </TabsContent>
        
        <TabsContent value="details" className="space-y-4 pt-4">
          <CardHeader className="px-6 pt-0">
            <CardTitle className="text-xl flex items-center gap-2">
              <Video className="h-5 w-5 text-primary" />
              Stream Created
            </CardTitle>
            <CardDescription>
              Use these details to start streaming with your preferred software
            </CardDescription>
          </CardHeader>
          
          <CardContent className="px-6 space-y-6">
            <div className="p-4 bg-muted rounded-lg space-y-4">
              <div className="space-y-2">
                <Label className="text-sm">RTMP URL</Label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={rtmpUrl}
                    className="font-mono text-sm"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => copyToClipboard(rtmpUrl, 'RTMP URL copied to clipboard')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">Stream Key</Label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    type={showStreamKey ? 'text' : 'password'}
                    value={streamKey}
                    className="font-mono text-sm"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setShowStreamKey(!showStreamKey)}
                  >
                    {showStreamKey ? 
                      <AlertCircle className="h-4 w-4" /> : 
                      <Eye className="h-4 w-4" />
                    }
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => copyToClipboard(streamKey, 'Stream key copied to clipboard')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Keep your stream key private. Never share it with anyone.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">Playback URL</Label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={playbackUrl}
                    className="font-mono text-sm"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => copyToClipboard(playbackUrl, 'Playback URL copied to clipboard')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="space-y-4 border border-dashed rounded-lg p-4">
              <h4 className="font-medium">What's next?</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Open your streaming software (OBS, Streamlabs, etc.)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Enter the RTMP URL and Stream Key in your software settings</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Set your desired resolution and bitrate (recommended: 1080p, 4-6 Mbps)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Start streaming in your software to go live!</span>
                </li>
              </ul>
            </div>
          </CardContent>
          
          <CardFooter className="px-6">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                // Reset the form for a new stream
                setTitle('');
                setDescription('');
                setScheduledTime('');
                setIsStreamCreated(false);
                setActiveTab('setup');
              }}
            >
              Create Another Stream
            </Button>
          </CardFooter>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default LiveStreamSetup;
