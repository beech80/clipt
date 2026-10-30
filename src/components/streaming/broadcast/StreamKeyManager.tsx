import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Copy, AlertCircle } from 'lucide-react';
import { getStreamCredentials } from '@/services/streamService';
import { useAuth } from '@/contexts/AuthContext';

interface StreamKeyManagerProps {
  streamId: string;
  manual?: boolean;
}

export const StreamKeyManager = ({ streamId, manual = false }: StreamKeyManagerProps) => {
  const { user } = useAuth();
  const [showKey, setShowKey] = useState(false);
  const [requested, setRequested] = useState(false);

  const { data: streamData, refetch, isLoading, error } = useQuery({
    queryKey: ['stream-key', user?.id, streamId],
    enabled: Boolean(user && streamId && (!manual || requested)),
    staleTime: manual ? Infinity : 0,
    refetchOnWindowFocus: !manual,
    refetchOnReconnect: !manual,
    gcTime: 0,
    retry: false,
    queryFn: async () => {
      const { data, error } = await getStreamCredentials(streamId);
      if (error) throw error;
      return data;
    },
  });

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Clipboard access failed');
    }
  };

  if (manual && !requested) return <Card className="p-4 space-y-3">
    <p>Load the existing five-minute test stream credentials only when you are ready to connect OBS. Keep the stream key private.</p>
    <Button disabled={!user} onClick={() => setRequested(true)}>Load OBS test credentials</Button>
  </Card>;

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-[200px]">
          <div className="animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </Card>
    );
  }

  if (error || !streamData) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center h-[200px] text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to load stream key</h3>
          <p className="text-sm text-muted-foreground mb-4">
            There was an error loading your stream information.
          </p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Stream Key Management</h3>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="stream-ingest-url">RTMP URL</Label>
          <div className="flex gap-2">
            <Input
              id="stream-ingest-url"
              value={streamData.rtmp_url}
              readOnly
              type="text"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(streamData.rtmp_url)}
              aria-label="Copy ingest URL"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="stream-ingest-key">Stream Key</Label>
          <div className="flex gap-2">
            <Input
              id="stream-ingest-key"
              value={streamData.stream_key || ''}
              type={showKey ? 'text' : 'password'}
              readOnly
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowKey(!showKey)}
              aria-label={showKey ? 'Hide stream key' : 'Show stream key'}
            >
              {showKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(streamData.stream_key || '')}
              aria-label="Copy stream key"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="stream-viewer-url">Stream URL (for viewers)</Label>
          <div className="flex gap-2">
            <Input
              id="stream-viewer-url"
              value={`${window.location.origin}/streaming/${streamData.id}`}
              readOnly
              type="text"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(`${window.location.origin}/streaming/${streamData.id}`)}
              aria-label="Copy viewer URL"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950 p-3 rounded-lg text-sm text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          <p className="flex items-start">
            <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
            <span>
              Keep your stream key private. Provider-backed key rotation is not available in Clipt yet.
            </span>
          </p>
        </div>

        <Button
          variant="secondary"
          disabled
          className="w-full"
        >
          Key rotation unavailable
        </Button>
      </div>
    </Card>
  );
};
