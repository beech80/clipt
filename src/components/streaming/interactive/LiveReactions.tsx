import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Heart, ThumbsUp, Star, Party, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LiveReactionsProps {
  streamId: string;
  userId: string;
}

interface Reaction {
  id: string;
  type: 'heart' | 'like' | 'star' | 'party' | 'fire';
  x: number;
  createdAt: Date;
}

export function LiveReactions({ streamId, userId }: LiveReactionsProps) {
  const [reactions, setReactions] = useState<Reaction[]>([]);

  useEffect(() => {
    const channel = supabase
      .channel(`stream-reactions-${streamId}`)
      .on(
        'broadcast',
        { event: 'reaction' },
        ({ payload }) => {
          const newReaction: Reaction = {
            id: Math.random().toString(),
            type: payload.type,
            x: Math.random() * 80 + 10, // Random position between 10-90%
            createdAt: new Date()
          };
          setReactions(prev => [...prev, newReaction]);

          // Remove reaction after animation
          setTimeout(() => {
            setReactions(prev => prev.filter(r => r.id !== newReaction.id));
          }, 3000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamId]);

  const sendReaction = async (type: Reaction['type']) => {
    try {
      const channel = supabase.channel(`stream-reactions-${streamId}`);
      await channel.send({
        type: 'broadcast',
        event: 'reaction',
        payload: { type, userId }
      });

      // Track interaction
      await supabase.from('stream_interactions').insert({
        stream_id: streamId,
        viewer_id: userId,
        interaction_type: 'reaction',
        interaction_data: { reaction_type: type }
      });
    } catch (error) {
      toast.error('Failed to send reaction');
    }
  };

  const getReactionIcon = (type: Reaction['type']) => {
    switch (type) {
      case 'heart': return <Heart className="h-6 w-6 text-red-500" />;
      case 'like': return <ThumbsUp className="h-6 w-6 text-blue-500" />;
      case 'star': return <Star className="h-6 w-6 text-yellow-500" />;
      case 'party': return <Party className="h-6 w-6 text-purple-500" />;
      case 'fire': return <Flame className="h-6 w-6 text-orange-500" />;
    }
  };

  return (
    <div className="relative min-h-[200px]">
      <div className="flex gap-2 justify-center mb-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => sendReaction('heart')}
          className="hover:bg-red-500/20"
        >
          <Heart className="h-4 w-4 text-red-500" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => sendReaction('like')}
          className="hover:bg-blue-500/20"
        >
          <ThumbsUp className="h-4 w-4 text-blue-500" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => sendReaction('star')}
          className="hover:bg-yellow-500/20"
        >
          <Star className="h-4 w-4 text-yellow-500" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => sendReaction('party')}
          className="hover:bg-purple-500/20"
        >
          <Party className="h-4 w-4 text-purple-500" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => sendReaction('fire')}
          className="hover:bg-orange-500/20"
        >
          <Flame className="h-4 w-4 text-orange-500" />
        </Button>
      </div>

      <AnimatePresence>
        {reactions.map((reaction) => (
          <motion.div
            key={reaction.id}
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            style={{
              position: 'absolute',
              bottom: '20px',
              left: `${reaction.x}%`,
            }}
            transition={{ duration: 1, type: 'spring' }}
          >
            {getReactionIcon(reaction.type)}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}