import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AlertData } from './types';
import { AlertAnimation } from './AlertAnimation';

interface StreamAlertOverlayProps {
  streamId: string;
}

export function StreamAlertOverlay({ streamId }: StreamAlertOverlayProps) {
  const [currentAlert, setCurrentAlert] = useState<AlertData | null>(null);
  const [queue, setQueue] = useState<AlertData[]>([]);

  useEffect(() => {
    // Subscribe to new alerts
    const channel = supabase
      .channel('alert-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'stream_alert_queue',
          filter: `stream_id=eq.${streamId}`,
        },
        (payload) => {
          const newAlert = {
            id: payload.new.id,
            type: payload.new.alert_type,
            data: payload.new.data,
            styles: payload.new.styles || {
              animation: 'fade',
              duration: 5000,
              soundEnabled: true,
              soundVolume: 0.5,
              fontSize: '24px',
              textColor: '#ffffff',
              backgroundColor: 'rgba(0,0,0,0.8)',
            },
          };
          setQueue((prev) => [...prev, newAlert]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamId]);

  // Process queue
  useEffect(() => {
    if (queue.length > 0 && !currentAlert) {
      const nextAlert = queue[0];
      setCurrentAlert(nextAlert);
      setQueue((prev) => prev.slice(1));

      // Mark alert as played in database
      supabase
        .from('stream_alert_queue')
        .update({ played: true, played_at: new Date().toISOString() })
        .eq('id', nextAlert.id)
        .then(({ error }) => {
          if (error) {
            console.error('Failed to mark alert as played:', error);
          }
        });

      // Clear current alert after duration
      setTimeout(() => {
        setCurrentAlert(null);
      }, nextAlert.styles.duration);
    }
  }, [queue, currentAlert]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AlertAnimation alert={currentAlert} />
    </div>
  );
}