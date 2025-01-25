import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  Video, 
  Download, 
  Trash2, 
  Settings, 
  Play, 
  Pause,
  Loader2
} from 'lucide-react';

interface StreamRecordingManagerProps {
  streamId: string;
}

interface RecordingSettings {
  quality: 'source' | 'high' | 'medium' | 'low';
  format: 'mp4' | 'mov' | 'ts';
  autoStart: boolean;
  maxDuration: number; // in minutes
}

export const StreamRecordingManager = ({ streamId }: StreamRecordingManagerProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [settings, setSettings] = useState<RecordingSettings>({
    quality: 'high',
    format: 'mp4',
    autoStart: true,
    maxDuration: 240, // 4 hours default
  });

  const { data: recordings, isLoading, refetch } = useQuery({
    queryKey: ['stream-recordings', streamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stream_recordings')
        .select('*')
        .eq('stream_id', streamId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const startRecordingMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('stream_recordings')
        .insert({
          stream_id: streamId,
          status: 'recording',
          recording_config: settings,
        });

      if (error) throw error;
      setIsRecording(true);
      toast.success('Recording started');
    },
  });

  const stopRecordingMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('stream_recordings')
        .update({ status: 'completed' })
        .eq('stream_id', streamId)
        .eq('status', 'recording');

      if (error) throw error;
      setIsRecording(false);
      toast.success('Recording stopped');
      refetch();
    },
  });

  const deleteRecordingMutation = useMutation({
    mutationFn: async (recordingId: string) => {
      const { error } = await supabase
        .from('stream_recordings')
        .delete()
        .eq('id', recordingId);

      if (error) throw error;
      toast.success('Recording deleted');
      refetch();
    },
  });

  const handleSettingsChange = (key: keyof RecordingSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Recording Settings</h3>
          <Button
            variant={isRecording ? "destructive" : "default"}
            onClick={() => {
              if (isRecording) {
                stopRecordingMutation.mutate();
              } else {
                startRecordingMutation.mutate();
              }
            }}
            disabled={startRecordingMutation.isPending || stopRecordingMutation.isPending}
          >
            {isRecording ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Stop Recording
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start Recording
              </>
            )}
          </Button>
        </div>

        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <Label>Auto-start recording</Label>
            <Switch
              checked={settings.autoStart}
              onCheckedChange={(checked) => handleSettingsChange('autoStart', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label>Recording Quality</Label>
            <select
              className="w-full p-2 border rounded"
              value={settings.quality}
              onChange={(e) => handleSettingsChange('quality', e.target.value)}
            >
              <option value="source">Source Quality</option>
              <option value="high">High (1080p)</option>
              <option value="medium">Medium (720p)</option>
              <option value="low">Low (480p)</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Format</Label>
            <select
              className="w-full p-2 border rounded"
              value={settings.format}
              onChange={(e) => handleSettingsChange('format', e.target.value)}
            >
              <option value="mp4">MP4</option>
              <option value="mov">MOV</option>
              <option value="ts">TS</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Max Duration (minutes)</Label>
            <Input
              type="number"
              value={settings.maxDuration}
              onChange={(e) => handleSettingsChange('maxDuration', parseInt(e.target.value))}
              min={1}
              max={720}
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recordings</h3>
        <div className="space-y-4">
          {recordings?.map((recording) => (
            <div
              key={recording.id}
              className="flex items-center justify-between p-4 bg-muted rounded-lg"
            >
              <div className="flex items-center space-x-4">
                <Video className="w-6 h-6" />
                <div>
                  <p className="font-medium">
                    {new Date(recording.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Status: {recording.status}
                  </p>
                  {recording.duration && (
                    <p className="text-sm text-muted-foreground">
                      Duration: {recording.duration}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {recording.recording_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(recording.recording_url, '_blank')}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteRecordingMutation.mutate(recording.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}

          {recordings?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No recordings found
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};