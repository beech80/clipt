
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import type { Stream } from "@/types/stream";

interface StreamKeyDisplayProps {
  stream: Stream | null;
  rtmpUrl: string;
}

export function StreamKeyDisplay({ stream, rtmpUrl }: StreamKeyDisplayProps) {
  const [showKey, setShowKey] = useState(false);

  const copyToClipboard = (text: string | null, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text)
      .then(() => toast.success(`${label} copied to clipboard`))
      .catch(() => toast.error(`Failed to copy ${label}`));
  };

  if (!stream?.streaming_url && !stream?.stream_key) return null;

  const displayUrl = stream.streaming_url || rtmpUrl;
  const displayKey = stream.streaming_url ? 
    new URL(stream.streaming_url).searchParams.get('access_token') : 
    stream.stream_key;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          {stream.streaming_url ? 'Access Token' : 'Stream Key'}
        </label>
        <div className="flex gap-2">
          <Input
            type={showKey ? 'text' : 'password'}
            value={displayKey || ''}
            readOnly
            className="font-mono"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowKey(!showKey)}
            title={showKey ? 'Hide Key' : 'Show Key'}
          >
            {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => copyToClipboard(displayKey, stream.streaming_url ? 'Access Token' : 'Stream Key')}
            title={`Copy ${stream.streaming_url ? 'Access Token' : 'Stream Key'}`}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Keep your {stream.streaming_url ? 'access token' : 'stream key'} private. Never share it with anyone.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Stream URL</label>
        <div className="flex gap-2">
          <Input 
            value={displayUrl} 
            readOnly 
            className="font-mono" 
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => copyToClipboard(displayUrl, 'Stream URL')}
            title="Copy Stream URL"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Use this URL in your streaming software (OBS, Streamlabs, etc.)
        </p>
      </div>
    </div>
  );
}
