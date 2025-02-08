import { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { EnhancedGamingDashboard } from "@/components/streaming/EnhancedGamingDashboard";
import GameBoyControls from "@/components/GameBoyControls";

export default function Streaming() {
  const { user } = useAuth();
  const [streamKey, setStreamKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const rtmpUrl = "rtmp://stream.lovable.dev/live";

  useEffect(() => {
    const loadStreamKey = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('streams')
        .select('encrypted_stream_key, is_live')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error loading stream key:', error);
        toast.error('Failed to load stream key');
        return;
      }

      if (data?.encrypted_stream_key) {
        setStreamKey(data.encrypted_stream_key);
        setIsLive(data.is_live || false);
      }
      setIsLoading(false);
    };

    loadStreamKey();

    // Subscribe to stream status changes
    const channel = supabase
      .channel('stream-status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'streams',
          filter: `user_id=eq.${user?.id}`
        },
        (payload) => {
          setIsLive(payload.new.is_live);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success(`${label} copied to clipboard`))
      .catch(() => toast.error(`Failed to copy ${label}`));
  };

  if (!user) {
    return (
      <Alert>
        <AlertDescription>Please log in to access streaming features.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">Streaming Dashboard</h1>
      
      <Card className="p-6 space-y-4">
        <h2 className="text-xl font-semibold mb-4">Stream Settings</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">RTMP URL</label>
            <div className="flex gap-2">
              <Input value={rtmpUrl} readOnly />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(rtmpUrl, 'RTMP URL')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Stream Key</label>
            <div className="flex gap-2">
              <Input
                type={showKey ? 'text' : 'password'}
                value={streamKey || ''}
                readOnly
                placeholder={isLoading ? 'Loading...' : 'No stream key found'}
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
              {streamKey && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(streamKey, 'Stream key')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      <EnhancedGamingDashboard 
        streamId={streamKey || ''} 
        userId={user.id}
        isLive={isLive}
      />

      <GameBoyControls />
    </div>
  );
}
