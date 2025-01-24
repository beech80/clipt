import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Copy, RefreshCw } from 'lucide-react';

interface StreamKeyManagerProps {
  streamId: string;
}

export const StreamKeyManager = ({ streamId }: StreamKeyManagerProps) => {
  const [showKey, setShowKey] = useState(false);

  const { data: stream, refetch } = useQuery({
    queryKey: ['stream-key', streamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('streams')
        .select('stream_key, rtmp_url')
        .eq('id', streamId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const regenerateKeyMutation = useMutation({
    mutationFn: async () => {
      const { data: newKey } = await supabase.rpc('generate_stream_key');
      
      const { error } = await supabase
        .from('streams')
        .update({ stream_key: newKey })
        .eq('id', streamId);

      if (error) throw error;
      return newKey;
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

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Stream Key Management</h3>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>RTMP URL</Label>
          <div className="flex gap-2">
            <Input
              value={stream?.rtmp_url || ''}
              readOnly
              type="text"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(stream?.rtmp_url || '')}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Stream Key</Label>
          <div className="flex gap-2">
            <Input
              value={stream?.stream_key || ''}
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
              onClick={() => copyToClipboard(stream?.stream_key || '')}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Button
          variant="secondary"
          onClick={() => regenerateKeyMutation.mutate()}
          disabled={regenerateKeyMutation.isPending}
          className="w-full"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Regenerate Stream Key
        </Button>
      </div>
    </Card>
  );
};