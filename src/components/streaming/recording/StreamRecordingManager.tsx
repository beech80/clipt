import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { RecordingListItem } from './RecordingListItem';
import { RecordingControls } from './RecordingControls';

interface StreamRecordingManagerProps {
  streamId: string;
}

export const StreamRecordingManager = ({ streamId }: StreamRecordingManagerProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [autoRecord, setAutoRecord] = useState(false);
  const queryClient = useQueryClient();

  const { data: recordings, isLoading } = useQuery({
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

  const startRecording = async () => {
    try {
      const { data: stream } = await supabase
        .from('streams')
        .select('user_id')
        .eq('id', streamId)
        .single();

      if (!stream) throw new Error('Stream not found');

      const storagePath = `${stream.user_id}/${streamId}/${new Date().toISOString()}.mp4`;

      const { error } = await supabase
        .from('stream_recordings')
        .insert({
          stream_id: streamId,
          status: 'recording',
          storage_path: storagePath,
          recording_url: null,
          duration: '0 seconds'
        });

      if (error) throw error;

      setIsRecording(true);
      toast.success('Recording started');
      await queryClient.invalidateQueries({ queryKey: ['stream-recordings', streamId] });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording');
    }
  };

  const stopRecording = async () => {
    try {
      const { error } = await supabase
        .from('stream_recordings')
        .update({ status: 'processing' })
        .eq('stream_id', streamId)
        .eq('status', 'recording');

      if (error) throw error;

      setIsRecording(false);
      toast.success('Recording stopped');
      await queryClient.invalidateQueries({ queryKey: ['stream-recordings', streamId] });
    } catch (error) {
      console.error('Error stopping recording:', error);
      toast.error('Failed to stop recording');
    }
  };

  const deleteRecording = useMutation({
    mutationFn: async (recordingId: string) => {
      const { data: recording } = await supabase
        .from('stream_recordings')
        .select('storage_path')
        .eq('id', recordingId)
        .single();

      if (recording?.storage_path) {
        await supabase.storage
          .from('recordings')
          .remove([recording.storage_path]);
      }

      const { error } = await supabase
        .from('stream_recordings')
        .delete()
        .eq('id', recordingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stream-recordings', streamId] });
      toast.success('Recording deleted');
    },
    onError: (error) => {
      console.error('Error deleting recording:', error);
      toast.error('Failed to delete recording');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <RecordingControls
        isRecording={isRecording}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        autoRecord={autoRecord}
        onAutoRecordChange={setAutoRecord}
      />

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Stream Recordings</h2>
        <div className="space-y-4">
          {recordings?.map((recording) => (
            <RecordingListItem
              key={recording.id}
              recording={recording}
              onDelete={(id) => deleteRecording.mutate(id)}
            />
          ))}
          {recordings?.length === 0 && (
            <p className="text-center text-muted-foreground py-4">
              No recordings available
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};