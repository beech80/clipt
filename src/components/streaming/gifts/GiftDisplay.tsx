import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Heart, Star, Trophy, Crown, Diamond } from "lucide-react";

interface GiftDisplayProps {
  streamId: string;
}

interface StreamGift {
  id: string;
  gift: {
    name: string;
    icon_url: string;
  };
  sender: {
    username: string;
  };
  message: string | null;
}

const giftIcons = {
  Heart,
  Star,
  Trophy,
  Diamond,
  Crown,
  Gift,
};

export function GiftDisplay({ streamId }: GiftDisplayProps) {
  const [gifts, setGifts] = useState<StreamGift[]>([]);

  useEffect(() => {
    const channel = supabase
      .channel("stream-gifts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "stream_gifts",
          filter: `stream_id=eq.${streamId}`,
        },
        async (payload) => {
          const { data: giftData } = await supabase
            .from("stream_gifts")
            .select(`
              id,
              gift:virtual_gifts(name, icon_url),
              sender:profiles(username),
              message
            `)
            .eq("id", payload.new.id)
            .single();

          if (giftData) {
            setGifts((prev) => [...prev, giftData as StreamGift]);
            // Remove gift after animation
            setTimeout(() => {
              setGifts((prev) => prev.filter((g) => g.id !== giftData.id));
            }, 5000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamId]);

  return (
    <div className="fixed bottom-24 right-4 space-y-2 pointer-events-none">
      <AnimatePresence>
        {gifts.map((gift) => {
          const IconComponent = giftIcons[gift.gift.name as keyof typeof giftIcons] || Gift;
          return (
            <motion.div
              key={gift.id}
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              className="flex items-center gap-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-3 rounded-lg shadow-lg"
            >
              <IconComponent className="h-5 w-5 text-primary" />
              <div className="flex flex-col">
                <p className="text-sm font-medium">
                  {gift.sender.username} sent a {gift.gift.name}!
                </p>
                {gift.message && (
                  <p className="text-xs text-muted-foreground">{gift.message}</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}