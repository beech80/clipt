import React from 'react';
import { Button } from '@/components/ui/button';
import { Video, Download, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface RecordingListItemProps {
  recording: {
    id: string;
    duration: string;
    created_at: string;
    status: string;
    storage_path: string | null;
    download_count: number;
  };
  onDelete: (id: string) => void;
}

export const RecordingListItem = ({ recording, onDelete }: RecordingListItemProps) => {
  const handleDownload = async () => {
    if (!recording.storage_path) {
      toast.error('Recording file not available');
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from('recordings')
        .download(recording.storage_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recording-${recording.id}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Update download count
      await supabase
        .from('stream_recordings')
        .update({ download_count: recording.download_count + 1 })
        .eq('id', recording.id);

      toast.success('Download started');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download recording');
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
      <div className="flex items-center space-x-4">
        <Video className="w-6 h-6" />
        <div>
          <p className="font-medium">Recording {recording.id.slice(0, 8)}</p>
          <p className="text-sm text-muted-foreground">
            Duration: {recording.duration}
          </p>
          <p className="text-sm text-muted-foreground">
            Created: {formatDistanceToNow(new Date(recording.created_at))} ago
          </p>
          <p className="text-sm text-muted-foreground">
            Downloads: {recording.download_count}
          </p>
        </div>
      </div>
      <div className="flex space-x-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleDownload}
          disabled={!recording.storage_path || recording.status !== 'completed'}
        >
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(recording.id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};