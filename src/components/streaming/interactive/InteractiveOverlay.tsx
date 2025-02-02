import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sparkles, Trophy, Gift } from 'lucide-react';

interface InteractiveOverlayProps {
  streamId: string;
  viewerId: string;
}

export function InteractiveOverlay({ streamId, viewerId }: InteractiveOverlayProps) {
  const [effects, setEffects] = useState<string[]>([]);

  useEffect(() => {
    const channel = supabase
      .channel(`stream_interactions:${streamId}`)
      .on('broadcast', { event: 'trigger_effect' }, ({ payload }) => {
        setEffects(prev => [...prev, payload.effectType]);
        setTimeout(() => {
          setEffects(prev => prev.filter(e => e !== payload.effectType));
        }, 3000);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamId]);

  const triggerEffect = async (effectType: string) => {
    try {
      await supabase
        .from('stream_interactions')
        .insert({
          stream_id: streamId,
          viewer_id: viewerId,
          interaction_type: 'overlay_trigger',
          interaction_data: { effectType }
        });

      toast.success('Effect triggered!');
    } catch (error) {
      toast.error('Failed to trigger effect');
    }
  };

  return (
    <Card className="fixed bottom-4 right-4 p-4 bg-background/80 backdrop-blur-sm">
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => triggerEffect('sparkles')}
          className="hover:bg-yellow-500/20"
        >
          <Sparkles className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => triggerEffect('trophy')}
          className="hover:bg-blue-500/20"
        >
          <Trophy className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => triggerEffect('gift')}
          className="hover:bg-pink-500/20"
        >
          <Gift className="h-4 w-4" />
        </Button>
      </div>
      
      {effects.map((effect, index) => (
        <div
          key={`${effect}-${index}`}
          className="fixed animate-fade-out"
          style={{
            left: `${Math.random() * 80 + 10}%`,
            top: `${Math.random() * 80 + 10}%`
          }}
        >
          {effect === 'sparkles' && <Sparkles className="h-8 w-8 text-yellow-500" />}
          {effect === 'trophy' && <Trophy className="h-8 w-8 text-blue-500" />}
          {effect === 'gift' && <Gift className="h-8 w-8 text-pink-500" />}
        </div>
      ))}
    </Card>
  );
}