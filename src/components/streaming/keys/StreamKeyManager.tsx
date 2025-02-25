import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Copy, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface StreamKeyManagerProps {
  streamId: string;
}

export const StreamKeyManager = ({ streamId }: StreamKeyManagerProps) => {
  const [showKey, setShowKey] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const regenerateKey = async () => {
    try {
      setIsRegenerating(true);
      const { data, error } = await supabase.rpc('generate_stream_key');
      
      if (error) throw error;

      await supabase
        .from('streams')
        .update({ stream_key: data })
        .eq('id', streamId);

      toast.success('Stream key regenerated successfully');
    } catch (error) {
      console.error('Failed to regenerate stream key:', error);
      toast.error('Failed to regenerate stream key');
    } finally {
      setIsRegenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Stream Key</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={regenerateKey}
            disabled={isRegenerating}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Regenerate Key
          </Button>
        </div>

        <div className="flex gap-2">
          <Input
            type={showKey ? 'text' : 'password'}
            value="••••••••••••••••"
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
            onClick={() => copyToClipboard('stream-key')}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Keep your stream key private. If compromised, click "Regenerate Key".
        </p>
      </div>
    </Card>
  );
};