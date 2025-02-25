import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Copy, Eye, Play, Settings, Square } from 'lucide-react';
import { StreamSettings } from './StreamSettings';
import { generateStreamKey } from '@/utils/streamUtils';

export const StreamDashboard = () => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const { data: stream, refetch } = useQuery({
    queryKey: ['stream', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('streams')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success(`${label} copied to clipboard`))
      .catch(() => toast.error(`Failed to copy ${label}`));
  };

  const startStream = async () => {
    if (!user) return;

    const streamKey = generateStreamKey();
    const streamUrl = `rtmp://stream.lovable.dev/live/${streamKey}`;

    const { error } = await supabase
      .from('streams')
      .upsert({
        user_id: user.id,
        title: title || 'Untitled Stream',
        description,
        is_live: true,
        started_at: new Date().toISOString(),
        stream_key: streamKey,
        stream_url: streamUrl
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to start stream');
      return;
    }

    toast.success('Stream started!');
    refetch();
  };

  const endStream = async () => {
    if (!stream) return;

    const { error } = await supabase
      .from('streams')
      .update({
        is_live: false,
        ended_at: new Date().toISOString()
      })
      .eq('id', stream.id);

    if (error) {
      toast.error('Failed to end stream');
      return;
    }

    toast.success('Stream ended');
    refetch();
  };

  if (!user) {
    return (
      <Card className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Please Login</h2>
        <p className="text-muted-foreground">
          You need to be logged in to access streaming features.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stream Info */}
        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">Stream Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter stream title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter stream description"
                rows={3}
              />
            </div>
          </div>
        </Card>

        {/* Stream Keys */}
        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">Stream Settings</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Stream Key</label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  value={stream?.stream_key || ''}
                  readOnly
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => stream?.stream_key && copyToClipboard(stream.stream_key, 'Stream key')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Stream URL</label>
              <div className="flex gap-2">
                <Input
                  value={stream?.stream_url || ''}
                  readOnly
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => stream?.stream_url && copyToClipboard(stream.stream_url, 'Stream URL')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Stream Controls */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="font-semibold">Stream Controls</h3>
            <p className="text-sm text-muted-foreground">
              {stream?.is_live ? 'Your stream is live!' : 'Start streaming when ready'}
            </p>
          </div>

          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              {stream?.is_live && (
                <div className="flex items-center gap-2 text-sm">
                  <Eye className="w-4 h-4" />
                  {stream.viewer_count || 0} viewers
                </div>
              )}
            </div>

            {stream?.is_live ? (
              <Button onClick={endStream} variant="destructive" className="gap-2">
                <Square className="w-4 h-4" />
                End Stream
              </Button>
            ) : (
              <Button onClick={startStream} className="gap-2">
                <Play className="w-4 h-4" />
                Start Stream
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Stream Settings */}
      {user && <StreamSettings userId={user.id} />}
    </div>
  );
};
