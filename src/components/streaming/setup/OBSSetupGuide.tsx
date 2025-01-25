import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Video, Camera, Mic, Info, Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { StreamingConfig } from "@/types/streaming";

export const OBSSetupGuide = () => {
  const { data: streamSettings } = useQuery({
    queryKey: ['stream-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('streaming_config')
        .select('*')
        .single();
      
      if (error) throw error;
      
      // Transform the data to match StreamingConfig type
      const transformedData: StreamingConfig = {
        ingest_endpoint: data.ingest_endpoint,
        playback_endpoint: data.playback_endpoint,
        provider: data.provider,
        settings: data.settings,
        cdn_provider: data.cdn_provider,
        cdn_config: data.cdn_config,
        obs_recommended_settings: data.obs_recommended_settings as StreamingConfig['obs_recommended_settings'],
        rtmp_server_locations: data.rtmp_server_locations,
        stream_key_prefix: data.stream_key_prefix
      };
      
      return transformedData;
    }
  });

  const { data: serverStatus } = useQuery({
    queryKey: ['obs-server-status'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('obs_server_status')
        .select('*')
        .eq('status', 'operational')
        .order('current_load', { ascending: true })
        .limit(1)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  const copyToClipboard = (text: string | null, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text)
      .then(() => toast.success(`${label} copied to clipboard`))
      .catch(() => toast.error(`Failed to copy ${label}`));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">OBS Setup Guide</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Basic Settings</h3>
          </div>
          <div className="space-y-2">
            <p>1. Open OBS Studio</p>
            <p>2. Go to Settings → Stream</p>
            <p>3. Select "Custom" as Service</p>
            {streamSettings && serverStatus && (
              <>
                <div className="flex items-center gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => copyToClipboard(serverStatus.server_url, 'Server URL')}
                    className="w-full"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Server URL
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Using optimal server in {serverStatus.region || 'your region'}
                </p>
              </>
            )}
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Video Settings</h3>
          </div>
          <div className="space-y-2">
            {streamSettings?.obs_recommended_settings?.video && (
              <>
                <p>Base Resolution: {streamSettings.obs_recommended_settings.video.resolution}</p>
                <p>Output Resolution: {streamSettings.obs_recommended_settings.video.resolution}</p>
                <p>Downscale Filter: Lanczos</p>
                <p>FPS: {streamSettings.obs_recommended_settings.video.fps}</p>
              </>
            )}
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Output Settings</h3>
          </div>
          <div className="space-y-2">
            {streamSettings?.obs_recommended_settings?.video && (
              <>
                <p>Encoder: {streamSettings.obs_recommended_settings.video.encoder}</p>
                <p>Rate Control: {streamSettings.obs_recommended_settings.video.rate_control}</p>
                <p>Bitrate: {streamSettings.obs_recommended_settings.video.bitrate.recommended} Kbps</p>
                <p>Keyframe Interval: {streamSettings.obs_recommended_settings.video.keyframe_interval}</p>
                <p>CPU Usage Preset: {streamSettings.obs_recommended_settings.video.preset}</p>
                <p>Profile: high</p>
              </>
            )}
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Audio Settings</h3>
          </div>
          <div className="space-y-2">
            {streamSettings?.obs_recommended_settings?.audio && (
              <>
                <p>Sample Rate: {streamSettings.obs_recommended_settings.audio.sample_rate}khz</p>
                <p>Channels: {streamSettings.obs_recommended_settings.audio.channels}</p>
                <p>Desktop Audio: Enable</p>
                <p>Mic/Auxiliary: Enable</p>
              </>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-6 mt-6">
        <div className="flex items-center gap-2 mb-4">
          <Info className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Quick Tips</h3>
        </div>
        <ul className="space-y-2">
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            Test your stream before going live
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            Monitor your CPU usage while streaming
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            Use Game Capture for better performance
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            Set up hotkeys for quick scene switching
          </li>
        </ul>
      </Card>
    </div>
  );
};