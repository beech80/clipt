
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

export function StreamKeyDisplay({ stream }: StreamKeyDisplayProps) {
  const [showToken, setShowToken] = useState(false);

  const copyToClipboard = (text: string | null, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text)
      .then(() => toast.success(`${label} copied to clipboard`))
      .catch(() => toast.error(`Failed to copy ${label}`));
  };

  if (!stream?.streaming_url) return null;

  const accessToken = new URL(stream.streaming_url).searchParams.get('access_token');

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          OBS Connection Guide
        </label>
        <ol className="list-decimal ml-4 space-y-2 text-sm text-muted-foreground">
          <li>Open OBS Studio</li>
          <li>Go to Settings → Stream</li>
          <li>Select "Custom..." as the service</li>
          <li>Copy and paste the URL below into the "Server" field</li>
          <li>No stream key is needed - the URL contains your access token</li>
          <li>Click "Apply" and then "OK"</li>
          <li>Click "Start Streaming" in OBS when ready</li>
        </ol>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Access Token
        </label>
        <div className="flex gap-2">
          <Input
            type={showToken ? 'text' : 'password'}
            value={accessToken || ''}
            readOnly
            className="font-mono"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowToken(!showToken)}
            title={showToken ? 'Hide Token' : 'Show Token'}
          >
            {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => copyToClipboard(accessToken, 'Access Token')}
            title="Copy Access Token"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          This access token is temporary and will expire when your stream ends.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Stream URL</label>
        <div className="flex gap-2">
          <Input 
            value={stream.streaming_url} 
            readOnly 
            className="font-mono" 
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => copyToClipboard(stream.streaming_url, 'Stream URL')}
            title="Copy Stream URL"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Copy this complete URL into OBS. No separate stream key is needed.
        </p>
      </div>
    </div>
  );
}
