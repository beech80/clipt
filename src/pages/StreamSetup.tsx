import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy, Eye, EyeOff } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export default function StreamSetup() {
  const [showKey, setShowKey] = useState(false);
  
  // Hardcoded values - Update these with the actual values from your streaming server
  // IMPORTANT: These must match your actual RTMP server configuration
  const RTMP_URL = "rtmp://live.clipt.cc/live";
  const STREAM_KEY = "live_5f9b3a2e1d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a";
  
  // Copy to clipboard function
  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${type} copied to clipboard.`,
        duration: 2000,
      });
    } catch (err) {
      console.error("Failed to copy:", err);
      toast({
        title: "Copy Failed",
        description: "Please try again or copy manually.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Stream Setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-950/30 p-4 rounded-md border border-blue-600/30">
            <h2 className="text-lg font-semibold mb-2 text-blue-400">How to Stream</h2>
            <ol className="list-decimal ml-5 space-y-1 text-gray-200">
              <li>Copy your Stream URL and Stream Key from below</li>
              <li>Open OBS Studio (or other streaming software)</li>
              <li>Go to Settings → Stream</li>
              <li>Select "Custom..." as the service</li>
              <li>Paste the Stream URL as the "Server"</li>
              <li>Paste your Stream Key in the "Stream Key" field</li>
              <li>Click "Apply" and then "OK"</li>
              <li>Click "Start Streaming" in OBS when ready</li>
            </ol>
          </div>
          
          {/* Stream URL Section */}
          <div>
            <h3 className="text-md font-medium mb-2">Stream URL</h3>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                value={RTMP_URL}
                readOnly
                className="font-mono bg-black/20 border-gray-700"
              />
              <Button
                onClick={() => copyToClipboard(RTMP_URL, "Stream URL")}
                className="whitespace-nowrap"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy URL
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              This is the Server URL you'll enter in OBS
            </p>
          </div>
          
          {/* Stream Key Section */}
          <div>
            <h3 className="text-md font-medium mb-2">Stream Key</h3>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-grow">
                <Input
                  type={showKey ? "text" : "password"}
                  value={STREAM_KEY}
                  readOnly
                  className="font-mono pr-10 bg-black/20 border-gray-700"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button
                onClick={() => copyToClipboard(STREAM_KEY, "Stream Key")}
                className="whitespace-nowrap"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Key
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Keep this key secret - anyone with this key can stream to your channel
            </p>
          </div>
          
          {/* Test Instructions */}
          <div className="bg-green-950/30 p-4 rounded-md border border-green-600/30">
            <h2 className="text-lg font-semibold mb-2 text-green-400">Testing Your Stream</h2>
            <p className="text-gray-200 mb-2">
              After setting up OBS with these details:
            </p>
            <ol className="list-decimal ml-5 space-y-1 text-gray-200">
              <li>Set your video output to 720p or 1080p</li>
              <li>Set your bitrate between 2,500-4,000 Kbps</li>
              <li>Click "Start Streaming" in OBS</li>
              <li>Return to Clipt and check if your stream appears</li>
            </ol>
          </div>
          
          {/* Quick Copy Section */}
          <div className="pt-4">
            <Button 
              variant="secondary" 
              size="lg"
              className="w-full"
              onClick={() => {
                copyToClipboard(`OBS STREAM SETTINGS:
Server: ${RTMP_URL}
Stream Key: ${STREAM_KEY}

INSTRUCTIONS:
1. Open OBS Studio
2. Go to Settings → Stream
3. Select "Custom..." as service
4. Paste Server and Stream Key in respective fields
5. Click Apply, then OK
6. Click "Start Streaming" when ready`, "Complete OBS Setup Guide");
              }}
            >
              <Copy className="mr-2 h-5 w-5" />
              Copy Complete OBS Setup Guide
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
