
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
      const { data, error } = await supabase.functions.invoke('stream-key', {
        body: { action: 'get' }
      });
      
      if (error) throw error;
      return data.streamKey;
    },
    enabled: !!userId
  });

  const generateKey = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('stream-key', {
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
    return <div>Loading...</div>;
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

        <p className="text-sm text-muted-foreground">
          Keep your stream key private. If compromised, click "Regenerate Key" to get a new one.
        </p>
      </div>
    </Card>
  );
};
