
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Copy, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { Stream } from '@/types/stream';

interface StreamAuthManagerProps {
  streamId: string;
}

export const StreamAuthManager = ({ streamId }: StreamAuthManagerProps) => {
  const [showToken, setShowToken] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const regenerateToken = async () => {
    try {
      setIsRegenerating(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('oauth', {
        body: {
          action: 'initialize_stream',
          userId: userData.user.id
        }
      });
      
      if (error) throw error;

      toast.success('Stream token regenerated successfully');
    } catch (error) {
      console.error('Failed to regenerate stream token:', error);
      toast.error('Failed to regenerate stream token');
    } finally {
      setIsRegenerating(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success(`${label} copied to clipboard`))
      .catch(() => toast.error(`Failed to copy ${label}`));
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Stream Authentication</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={regenerateToken}
            disabled={isRegenerating}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Regenerate Token
          </Button>
        </div>

        <div className="flex gap-2">
          <Input
            type={showToken ? 'text' : 'password'}
            value="••••••••••••••••"
            readOnly
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowToken(!showToken)}
          >
            {showToken ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => copyToClipboard('stream-token', 'Stream Token')}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Keep your stream token private. If compromised, click "Regenerate Token".
        </p>
      </div>
    </Card>
  );
};
