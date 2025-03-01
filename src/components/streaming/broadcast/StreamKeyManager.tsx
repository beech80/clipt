import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Copy, RefreshCw, AlertCircle } from 'lucide-react';
import { getStreamById, regenerateStreamKey } from '@/services/streamService';

interface StreamKeyManagerProps {
  streamId: string;
}

export const StreamKeyManager = ({ streamId }: StreamKeyManagerProps) => {
  const [showKey, setShowKey] = useState(false);

  const { data: streamData, refetch, isLoading, error } = useQuery({
    queryKey: ['stream-key', streamId],
    queryFn: async () => {
      const { data, error } = await getStreamById(streamId);
      if (error) throw error;
      return data;
    },
  });

  const regenerateKeyMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await regenerateStreamKey(streamId);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      refetch();
      toast.success('Stream key regenerated successfully');
    },
    onError: (error) => {
      console.error('Failed to regenerate stream key:', error);
      toast.error('Failed to regenerate stream key');
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

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
          <Label>RTMP URL</Label>
          <div className="flex gap-2">
            <Input
              value={streamData.rtmp_url || 'rtmp://stream.clipt.app/live'}
              readOnly
              type="text"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(streamData.rtmp_url || 'rtmp://stream.clipt.app/live')}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Stream Key</Label>
          <div className="flex gap-2">
            <Input
              value={streamData.stream_key || ''}
              type={showKey ? 'text' : 'password'}
              readOnly
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowKey(!showKey)}
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
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Stream URL (for viewers)</Label>
          <div className="flex gap-2">
            <Input
              value={`https://clipt.app/live/${streamData.stream_path || streamData.id}`}
              readOnly
              type="text"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(`https://clipt.app/live/${streamData.stream_path || streamData.id}`)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950 p-3 rounded-lg text-sm text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          <p className="flex items-start">
            <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
            <span>
              Warning: Regenerating your stream key will disconnect any active broadcasts. Only do this if you believe your key has been compromised.
            </span>
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={() => regenerateKeyMutation.mutate()}
          disabled={regenerateKeyMutation.isPending}
          className="w-full"
        >
          {regenerateKeyMutation.isPending ? (
            <span className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full"></span>
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Regenerate Stream Key
        </Button>
      </div>
    </Card>
  );
};