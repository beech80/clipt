
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Copy, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface StreamKeyManagerProps {
  userId: string;
}

export const StreamKeyManager = ({ userId }: StreamKeyManagerProps) => {
  const [showKey, setShowKey] = useState(false);
  const queryClient = useQueryClient();

  const { data: streamKey, isLoading } = useQuery({
    queryKey: ['streamKey', userId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<{ streamKey: string }>('stream-key', {
        body: { action: 'get' }
      });
      
      if (error) throw error;
      return data.streamKey;
    },
    enabled: !!userId
  });

  const generateKey = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke<{ streamKey: string }>('stream-key', {
        body: { action: 'generate' }
      });
      
      if (error) throw error;
      return data.streamKey;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streamKey'] });
      toast.success('Stream key regenerated successfully');
    },
    onError: (error) => {
      console.error('Failed to regenerate stream key:', error);
      toast.error('Failed to regenerate stream key');
    }
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success('Stream key copied to clipboard'))
      .catch(() => toast.error('Failed to copy stream key'));
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div>Loading stream key...</div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Stream Key</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateKey.mutate()}
            disabled={generateKey.isPending}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Regenerate Key
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">RTMP URL</h4>
            <div className="flex gap-2">
              <Input
                value="rtmp://stream.lovable.dev/live"
                readOnly
                className="font-mono"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard("rtmp://stream.lovable.dev/live")}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Stream Key</h4>
            <div className="flex gap-2">
              <Input
                type={showKey ? 'text' : 'password'}
                value={streamKey || ''}
                readOnly
                className="font-mono"
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
                onClick={() => streamKey && copyToClipboard(streamKey)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-4 text-sm text-muted-foreground">
          <p>To stream using OBS Studio:</p>
          <ol className="list-decimal list-inside mt-2 space-y-1">
            <li>Open OBS Studio</li>
            <li>Go to Settings → Stream</li>
            <li>Select "Custom..." as the service</li>
            <li>Copy and paste the RTMP URL into "Server"</li>
            <li>Copy and paste your Stream Key into "Stream Key"</li>
            <li>Click "Apply" and then "OK"</li>
            <li>Click "Start Streaming" when ready</li>
          </ol>
        </div>

        <p className="text-sm text-muted-foreground mt-4">
          Keep your stream key private. If compromised, use the "Regenerate Key" button to create a new one.
        </p>
      </div>
    </Card>
  );
};
