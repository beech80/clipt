import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Clock, Play, Download } from 'lucide-react';
import { toast } from 'sonner';

interface StreamHighlight {
  id: string;
  title: string;
  duration: string;
}

interface StreamHighlightsProps {
  streamId: string;
}

export const StreamHighlights = ({ streamId }: StreamHighlightsProps) => {
  const { data: highlights } = useQuery({
    queryKey: ['stream-highlights', streamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stream_highlights')
        .select('*')
        .eq('stream_id', streamId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as StreamHighlight[];
    }
  });

  const createHighlight = useMutation({
    mutationFn: async ({ title, startTime, duration }: { 
      title: string;
      startTime: string;
      duration: string;
    }) => {
      const { error } = await supabase
        .from('stream_highlights')
        .insert({
          stream_id: streamId,
          title,
          start_time: startTime,
          duration
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Highlight created!');
    },
    onError: () => {
      toast.error('Failed to create highlight');
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Stream Highlights</h3>
        <Button
          size="sm"
          onClick={() => {
            createHighlight.mutate({
              title: "Quick Highlight",
              startTime: "00:00:00",
              duration: "00:00:30"
            });
          }}
        >
          Create Highlight
        </Button>
      </div>

      <div className="space-y-2">
        {highlights?.map((highlight) => (
          <Card key={highlight.id} className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium">{highlight.title}</h4>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{highlight.duration}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="icon" variant="ghost">
                  <Play className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};