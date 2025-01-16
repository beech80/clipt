import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface ViewerCountManagerProps {
  streamId: string;
  viewerCount: number;
  onViewerCountChange: (count: number) => void;
}

export const ViewerCountManager = ({
  streamId,
  viewerCount,
  onViewerCountChange
}: ViewerCountManagerProps) => {
  useEffect(() => {
    if (!streamId) return;

    const incrementViewers = async () => {
      const { error } = await supabase
        .from('streams')
        .update({ viewer_count: viewerCount + 1 })
        .eq('id', streamId);

      if (error) {
        console.error('Error incrementing viewer count:', error);
      }
    };

    const decrementViewers = async () => {
      const { error } = await supabase
        .from('streams')
        .update({ viewer_count: Math.max(0, viewerCount - 1) })
        .eq('id', streamId);

      if (error) {
        console.error('Error decrementing viewer count:', error);
      }
    };

    // Subscribe to viewer count updates
    const channel = supabase
      .channel('stream-viewers')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'streams',
          filter: `id=eq.${streamId}`
        },
        (payload) => {
          onViewerCountChange(payload.new.viewer_count || 0);
        }
      )
      .subscribe();

    // Initialize viewer count
    incrementViewers();

    return () => {
      decrementViewers();
      supabase.removeChannel(channel);
    };
  }, [streamId, viewerCount, onViewerCountChange]);

  return null;
};