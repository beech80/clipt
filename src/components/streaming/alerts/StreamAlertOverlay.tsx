import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface AlertData {
  id: string;
  type: 'follow' | 'subscription' | 'donation' | 'host' | 'raid';
  data: {
    username: string;
    amount?: number;
    message?: string;
  };
  styles: {
    animation: string;
    duration: number;
    soundEnabled: boolean;
    soundVolume: number;
    fontSize: string;
    textColor: string;
    backgroundColor: string;
  };
}

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

  if (!currentAlert) return null;

  const animations = {
    fade: {
      initial: { opacity: 0, y: 50 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -50 },
    },
    scale: {
      initial: { scale: 0, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 0, opacity: 0 },
    },
    slide: {
      initial: { x: '100%' },
      animate: { x: 0 },
      exit: { x: '-100%' },
    },
  };

  const getAlertContent = (alert: AlertData) => {
    switch (alert.type) {
      case 'follow':
        return `${alert.data.username} just followed!`;
      case 'subscription':
        return `${alert.data.username} just subscribed!`;
      case 'donation':
        return `${alert.data.username} donated ${alert.data.amount}!`;
      case 'host':
        return `${alert.data.username} is hosting with ${alert.data.amount} viewers!`;
      case 'raid':
        return `${alert.data.username} is raiding with ${alert.data.amount} viewers!`;
      default:
        return 'New alert!';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {currentAlert && (
          <motion.div
            key={currentAlert.id}
            initial={animations[currentAlert.styles.animation as keyof typeof animations].initial}
            animate={animations[currentAlert.styles.animation as keyof typeof animations].animate}
            exit={animations[currentAlert.styles.animation as keyof typeof animations].exit}
            transition={{ duration: 0.5 }}
            style={{
              backgroundColor: currentAlert.styles.backgroundColor,
              color: currentAlert.styles.textColor,
              fontSize: currentAlert.styles.fontSize,
            }}
            className="rounded-lg p-4 shadow-lg min-w-[300px]"
          >
            {getAlertContent(currentAlert)}
            {currentAlert.data.message && (
              <p className="mt-2 text-sm opacity-80">{currentAlert.data.message}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}