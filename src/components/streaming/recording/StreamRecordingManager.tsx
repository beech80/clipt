import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Video, Scissors } from 'lucide-react';

interface StreamRecording {
  id: string;
  recording_url: string;
  duration: string;
  created_at: string;
  status: string;
  thumbnail_url: string | null;
  view_count: number;
}

interface StreamHighlight {
  id: string;
  title: string;
  description: string;
  start_time: string;
  duration: string;
  highlight_url: string | null;
  thumbnail_url: string | null;
  created_at: string;
  view_count: number;
}

interface RecordingSettings {
  quality: 'source' | 'high' | 'medium' | 'low';
  format: 'mp4' | 'mov' | 'ts';
  autoStart: boolean;
  maxDuration: number;
}

export const StreamRecordingManager = ({ streamId }: { streamId: string }) => {
  const { data: recordings, isLoading: recordingsLoading } = useQuery({
    queryKey: ['stream-recordings', streamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stream_recordings')
        .select('*')
        .eq('stream_id', streamId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as StreamRecording[];
    },
  });

  const { data: highlights, isLoading: highlightsLoading } = useQuery({
    queryKey: ['stream-highlights', streamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stream_highlights')
        .select('*')
        .eq('stream_id', streamId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as StreamHighlight[];
    },
  });

  const createHighlight = async (recordingId: string) => {
    try {
      const title = prompt('Enter highlight title:');
      if (!title) return;

      const description = prompt('Enter highlight description:');
      const startTime = prompt('Enter start time (in seconds):');
      const duration = prompt('Enter duration (in seconds):');

      if (!startTime || !duration) return;

      const { error } = await supabase.from('stream_highlights').insert({
        stream_id: streamId,
        title,
        description,
        start_time: `${parseInt(startTime)} seconds`,
        duration: `${parseInt(duration)} seconds`,
      });

      if (error) throw error;
      toast.success('Highlight created successfully');
    } catch (error) {
      console.error('Error creating highlight:', error);
      toast.error('Failed to create highlight');
    }
  };

  if (recordingsLoading || highlightsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Stream Recordings</h2>
        <div className="grid gap-4">
          {recordings?.map((recording) => (
            <div
              key={recording.id}
              className="flex items-center justify-between p-4 bg-muted rounded-lg"
            >
              <div className="flex items-center space-x-4">
                <Video className="w-6 h-6" />
                <div>
                  <p className="font-medium">Recording {recording.id.slice(0, 8)}</p>
                  <p className="text-sm text-muted-foreground">
                    Duration: {recording.duration}
                  </p>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => createHighlight(recording.id)}
              >
                <Scissors className="w-4 h-4 mr-2" />
                Create Highlight
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Stream Highlights</h2>
        <div className="grid gap-4">
          {highlights?.map((highlight) => (
            <div
              key={highlight.id}
              className="p-4 bg-muted rounded-lg"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium">{highlight.title}</h3>
                <span className="text-sm text-muted-foreground">
                  {new Date(highlight.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {highlight.description}
              </p>
              <div className="text-sm text-muted-foreground">
                <p>Start: {highlight.start_time}</p>
                <p>Duration: {highlight.duration}</p>
                <p>Views: {highlight.view_count}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};