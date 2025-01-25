import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Heart, Star, Trophy, Crown, Diamond, Gift } from 'lucide-react';
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";

interface VirtualGift {
  id: string;
  name: string;
  description: string;
  price: number;
  icon_url: string;
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
  const [selectedGift, setSelectedGift] = React.useState<VirtualGift | null>(null);
  const [message, setMessage] = React.useState("");
  const [quantity, setQuantity] = React.useState(1);
  const [isOpen, setIsOpen] = React.useState(false);
  const { user } = useAuth();

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
    if (!selectedGift || !user) return;

    try {
      const { error } = await supabase.from("stream_gifts").insert({
        stream_id: streamId,
        gift_id: selectedGift.id,
        sender_id: user.id,
        amount: selectedGift.price * quantity,
        message: message.trim() || null,
        quantity
      });

      if (error) throw error;

      toast.success(`Sent ${quantity}x ${selectedGift.name} gift${quantity > 1 ? 's' : ''}!`);
      setSelectedGift(null);
      setMessage("");
      setQuantity(1);
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
              <Card
                key={gift.id}
                className={`p-4 cursor-pointer transition-all ${
                  selectedGift?.id === gift.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedGift(gift)}
              >
                <div className="flex flex-col items-center gap-2">
                  <IconComponent className="h-6 w-6" />
                  <div className="text-sm font-medium">{gift.name}</div>
                  <div className="text-xs text-muted-foreground">${gift.price}</div>
                </div>
              </Card>
            );
          })}
        </div>
        {selectedGift && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                min="1"
                max="99"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="space-y-2">
              <Label>Message (optional)</Label>
              <Input
                placeholder="Add a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            <Button 
              className="w-full" 
              onClick={sendGift}
            >
              Send {quantity}x {selectedGift.name} (${selectedGift.price * quantity})
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}