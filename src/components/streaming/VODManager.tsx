import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Video, Trash2, Scissors, Clock, BarChart2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BatchProcessingManager } from './batch/BatchProcessingManager';

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

interface Chapter {
  id: string;
  title: string;
  timestamp: number;
  description?: string;
}

export const VODManager = ({ streamId }: VODManagerProps) => {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRecord, setAutoRecord] = useState(true);
  const [selectedRecording, setSelectedRecording] = useState<string | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [newChapter, setNewChapter] = useState({
    title: '',
    timestamp: 0,
    description: ''
  });

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
      
      const formattedData = data?.map(recording => ({
        ...recording,
        duration: recording.duration?.toString() || '0:00'
      })) || [];
      
      setRecordings(formattedData);
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

  const createClip = async (recordingId: string) => {
    try {
      const { data, error } = await supabase
        .from('clip_editing_sessions')
        .insert({
          recording_id: recordingId,
          status: 'draft',
          effects: []
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Clip editor opened');
      // Navigate to clip editor or open modal
    } catch (error) {
      console.error('Error creating clip:', error);
      toast.error('Failed to create clip');
    }
  };

  const addChapter = async () => {
    if (!selectedRecording) return;

    try {
      const { error } = await supabase
        .from('vod_chapters')
        .insert({
          recording_id: selectedRecording,
          title: newChapter.title,
          timestamp: newChapter.timestamp,
          description: newChapter.description
        });

      if (error) throw error;

      toast.success('Chapter added successfully');
      setNewChapter({ title: '', timestamp: 0, description: '' });
      loadChapters(selectedRecording);
    } catch (error) {
      console.error('Error adding chapter:', error);
      toast.error('Failed to add chapter');
    }
  };

  const loadChapters = async (recordingId: string) => {
    try {
      const { data, error } = await supabase
        .from('vod_chapters')
        .select('*')
        .eq('recording_id', recordingId)
        .order('timestamp', { ascending: true });

      if (error) throw error;
      setChapters(data);
    } catch (error) {
      console.error('Error loading chapters:', error);
      toast.error('Failed to load chapters');
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">VOD Recordings</h3>
        <div className="flex items-center space-x-2">
          <Switch
            checked={autoRecord}
            onCheckedChange={setAutoRecord}
            id="auto-record"
          />
          <Label htmlFor="auto-record">Auto-record streams</Label>
        </div>
      </div>

      <Tabs defaultValue="recordings" className="w-full">
        <TabsList>
          <TabsTrigger value="recordings">Recordings</TabsTrigger>
          <TabsTrigger value="chapters">Chapters</TabsTrigger>
          <TabsTrigger value="batch">Batch Processing</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="recordings" className="space-y-4">
          {recordings?.map((recording) => (
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
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedRecording(recording.id);
                      loadChapters(recording.id);
                    }}
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Chapters
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => createClip(recording.id)}
                  >
                    <Scissors className="w-4 h-4 mr-2" />
                    Create Clip
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => deleteRecording(recording.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {recordings?.length === 0 && (
            <div className="text-center py-8">
              <Video className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No recordings available</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="chapters" className="space-y-4">
          {selectedRecording ? (
            <>
              <Card className="p-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={newChapter.title}
                        onChange={(e) => setNewChapter(prev => ({
                          ...prev,
                          title: e.target.value
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timestamp">Timestamp (seconds)</Label>
                      <Input
                        id="timestamp"
                        type="number"
                        value={newChapter.timestamp}
                        onChange={(e) => setNewChapter(prev => ({
                          ...prev,
                          timestamp: parseInt(e.target.value)
                        }))}
                      />
                    </div>
                  </div>
                  <Button onClick={addChapter}>Add Chapter</Button>
                </div>
              </Card>

              {chapters.map((chapter) => (
                <Card key={chapter.id} className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">{chapter.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {Math.floor(chapter.timestamp / 60)}:{(chapter.timestamp % 60).toString().padStart(2, '0')}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Select a recording to manage chapters</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="batch" className="space-y-4">
          <BatchProcessingManager />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">VOD Performance</h4>
              <BarChart2 className="w-4 h-4 text-muted-foreground" />
            </div>
            {/* Add analytics charts/metrics here */}
          </Card>
        </TabsContent>
      </Tabs>
    </Card>
  );
};
