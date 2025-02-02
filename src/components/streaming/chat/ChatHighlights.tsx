import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Pin, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface ChatHighlight {
  id: string;
  message_id: string;
  pinned: boolean;
  pinned_at: string;
  message: {
    content: string;
    user_id: string;
    profiles: {
      username: string;
    }
  }
}

interface ChatHighlightsProps {
  streamId: string;
  isModerator: boolean;
}

export function ChatHighlights({ streamId, isModerator }: ChatHighlightsProps) {
  const [highlights, setHighlights] = useState<ChatHighlight[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchHighlights = async () => {
      const { data, error } = await supabase
        .from('chat_highlights')
        .select(`
          *,
          message:stream_chat(
            content,
            user_id,
            profiles:profiles(username)
          )
        `)
        .eq('stream_id', streamId)
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Failed to load highlights');
        return;
      }

      setHighlights(data || []);
    };

    fetchHighlights();

    // Subscribe to changes
    const channel = supabase
      .channel(`highlights:${streamId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_highlights',
        filter: `stream_id=eq.${streamId}`
      }, () => {
        fetchHighlights();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamId]);

  const togglePin = async (highlightId: string, isPinned: boolean) => {
    try {
      const { error } = await supabase
        .from('chat_highlights')
        .update({
          pinned: !isPinned,
          pinned_at: !isPinned ? new Date().toISOString() : null,
          pinned_by: !isPinned ? user?.id : null
        })
        .eq('id', highlightId);

      if (error) throw error;
      toast.success(isPinned ? 'Message unpinned' : 'Message pinned');
    } catch (error) {
      toast.error('Failed to update pin status');
    }
  };

  const deleteHighlight = async (highlightId: string) => {
    try {
      const { error } = await supabase
        .from('chat_highlights')
        .delete()
        .eq('id', highlightId);

      if (error) throw error;
      toast.success('Highlight deleted');
    } catch (error) {
      toast.error('Failed to delete highlight');
    }
  };

  return (
    <ScrollArea className="h-[400px] p-4">
      <div className="space-y-4">
        {highlights.map((highlight) => (
          <div
            key={highlight.id}
            className={`p-4 rounded-lg ${
              highlight.pinned ? 'bg-primary/10' : 'bg-muted'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="font-medium">
                  {highlight.message.profiles.username}
                </span>
                <p className="text-sm mt-1">{highlight.message.content}</p>
              </div>
              {isModerator && (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => togglePin(highlight.id, highlight.pinned)}
                  >
                    <Pin className={`h-4 w-4 ${highlight.pinned ? 'text-primary' : ''}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteHighlight(highlight.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            {highlight.pinned && (
              <div className="text-xs text-muted-foreground mt-2">
                Pinned {new Date(highlight.pinned_at).toLocaleDateString()}
              </div>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}