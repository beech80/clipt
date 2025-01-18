import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Gift, Heart, Star, Trophy, Crown, Diamond } from "lucide-react";
import { toast } from "sonner";

interface VirtualGift {
  id: string;
  name: string;
  description: string;
  price: number;
  icon_url: string;
  animation_url: string | null;
}

interface VirtualGiftSelectorProps {
  streamId: string;
  isLive: boolean;
}

const giftIcons = {
  Heart,
  Star,
  Trophy,
  Diamond,
  Crown,
  Gift,
};

export function VirtualGiftSelector({ streamId, isLive }: VirtualGiftSelectorProps) {
  const [selectedGift, setSelectedGift] = useState<VirtualGift | null>(null);
  const [message, setMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const { data: gifts, isLoading } = useQuery({
    queryKey: ["virtual-gifts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("virtual_gifts")
        .select("*")
        .order("price", { ascending: true });

      if (error) throw error;
      return data as VirtualGift[];
    },
  });

  const sendGift = async () => {
    if (!selectedGift) return;

    try {
      const { error } = await supabase.from("stream_gifts").insert({
        stream_id: streamId,
        gift_id: selectedGift.id,
        amount: selectedGift.price,
        message: message.trim() || null,
      });

      if (error) throw error;

      toast.success(`Sent ${selectedGift.name} gift!`);
      setSelectedGift(null);
      setMessage("");
      setIsOpen(false);
    } catch (error) {
      toast.error("Failed to send gift");
    }
  };

  if (!isLive) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="gap-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        >
          <Gift className="h-4 w-4" />
          Send Gift
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Send a Virtual Gift</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-4 py-4">
          {gifts?.map((gift) => {
            const IconComponent = giftIcons[gift.name as keyof typeof giftIcons] || Gift;
            return (
              <Button
                key={gift.id}
                variant={selectedGift?.id === gift.id ? "default" : "outline"}
                className="flex flex-col gap-2 h-auto py-4"
                onClick={() => setSelectedGift(gift)}
              >
                <IconComponent className="h-6 w-6" />
                <div className="text-sm font-medium">{gift.name}</div>
                <div className="text-xs text-muted-foreground">${gift.price}</div>
              </Button>
            );
          })}
        </div>
        <div className="space-y-4">
          <textarea
            placeholder="Add a message (optional)"
            className="w-full h-20 p-2 text-sm border rounded-md"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <Button 
            className="w-full" 
            onClick={sendGift}
            disabled={!selectedGift}
          >
            Send Gift
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}