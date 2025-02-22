
import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { BroadcastPresetForm } from "@/components/broadcasting/BroadcastPresetForm";
import { Card } from "@/components/ui/card";
import { BackButton } from "@/components/ui/back-button";
import GameBoyControls from "@/components/GameBoyControls";
import { OBSSetupGuide } from "@/components/streaming/setup/OBSSetupGuide";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const Broadcasting = () => {
  const { user } = useAuth();
  const [showKey, setShowKey] = useState(false);
  const queryClient = useQueryClient();

  const { data: streamKey, isLoading: isLoadingKey } = useQuery({
    queryKey: ['stream-key', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('stream_keys')
        .select('key')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      return data?.key;
    },
    enabled: !!user?.id
  });

  const regenerateKeyMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase.rpc('generate_user_stream_key', {
        user_id_param: user.id
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stream-key'] });
      toast.success('Stream key regenerated successfully');
    },
    onError: (error) => {
      console.error('Error regenerating stream key:', error);
      toast.error('Failed to regenerate stream key');
    }
  });

  const copyToClipboard = (text: string | null, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text)
      .then(() => toast.success(`${label} copied to clipboard`))
      .catch(() => toast.error(`Failed to copy ${label}`));
  };

  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Please Login</h2>
          <p className="text-muted-foreground">
            You need to be logged in to access broadcasting features.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6 pb-40">
      <div className="flex items-center gap-4">
        <BackButton />
        <h1 className="text-2xl font-bold">Broadcasting Studio</h1>
      </div>

      {/* Stream Key Management */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Stream Key</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => regenerateKeyMutation.mutate()}
              disabled={regenerateKeyMutation.isPending}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Regenerate Key
            </Button>
          </div>

          <div className="flex gap-2">
            <Input
              type={showKey ? 'text' : 'password'}
              value={isLoadingKey ? 'Loading...' : (streamKey || 'No stream key found')}
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
              onClick={() => copyToClipboard(streamKey, 'Stream key')}
              disabled={!streamKey}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            Keep your stream key private. If compromised, click "Regenerate Key".
          </p>
        </div>
      </Card>

      <OBSSetupGuide />
      
      <BroadcastPresetForm userId={user.id} />
      
      <GameBoyControls />
    </div>
  );
}

export default Broadcasting;
