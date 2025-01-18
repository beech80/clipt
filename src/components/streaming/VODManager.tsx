import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Video, Trash2 } from 'lucide-react';

interface VODManagerProps {
  streamId: string;
}

interface Recording {
  id: string;
  recording_url: string;
  duration: string;
  created_at: string;
  status: string;
  thumbnail_url: string | null;
  view_count: number;
}

export const VODManager = ({ streamId }: VODManagerProps) => {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRecordings();
  }, [streamId]);

  const loadRecordings = async () => {
    try {
      const { data, error } = await supabase
        .from('stream_recordings')
        .select('*')
        .eq('stream_id', streamId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecordings(data || []);
    } catch (error) {
      console.error('Error loading recordings:', error);
      toast.error('Failed to load recordings');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteRecording = async (recordingId: string) => {
    try {
      const { error } = await supabase
        .from('stream_recordings')
        .delete()
        .eq('id', recordingId);

      if (error) throw error;
      
      setRecordings(recordings.filter(r => r.id !== recordingId));
      toast.success('Recording deleted successfully');
    } catch (error) {
      console.error('Error deleting recording:', error);
      toast.error('Failed to delete recording');
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">VOD Recordings</h3>
      </div>

      <div className="space-y-4">
        {recordings.map((recording) => (
          <Card key={recording.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {recording.thumbnail_url ? (
                  <img 
                    src={recording.thumbnail_url} 
                    alt="Recording thumbnail" 
                    className="w-24 h-16 object-cover rounded"
                  />
                ) : (
                  <Video className="w-8 h-8 text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium">
                    {new Date(recording.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Duration: {recording.duration}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Views: {recording.view_count}
                  </p>
                </div>
              </div>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => deleteRecording(recording.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}

        {recordings.length === 0 && !isLoading && (
          <div className="text-center py-8">
            <Video className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No recordings available</p>
          </div>
        )}
      </div>
    </Card>
  );
};