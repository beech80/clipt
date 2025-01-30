import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import { Gift, Heart, Star, Trophy, Crown, Diamond } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface VirtualGift {
  id: string;
  name: string;
  description: string;
  price: number;
  icon_url: string | null;
  animation_url: string | null;
}

const giftIcons = {
  Heart,
  Star,
  Trophy,
  Crown,
  Diamond,
  Gift,
};

export function VirtualGiftStore({ streamId }: { streamId: string }) {
  const [selectedGift, setSelectedGift] = useState<VirtualGift | null>(null);
  const [quantity, setQuantity] = useState(1);
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
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        toast.error("You must be logged in to send gifts");
        return;
      }

      const { error } = await supabase.from("stream_gifts").insert({
        stream_id: streamId,
        gift_id: selectedGift.id,
        sender_id: user.data.user.id,
        amount: selectedGift.price * quantity,
        message: message.trim() || null,
        quantity,
      });

      if (error) throw error;

      toast.success(`Sent ${quantity}x ${selectedGift.name}!`);
      setSelectedGift(null);
      setMessage("");
      setQuantity(1);
      setIsOpen(false);
    } catch (error) {
      toast.error("Failed to send gift");
    }
  };

  if (isLoading) {
    return <div>Loading gifts...</div>;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
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
                  selectedGift?.id === gift.id ? "ring-2 ring-primary" : ""
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
            <div>
              <label className="text-sm font-medium">Quantity</label>
              <Input
                type="number"
                min="1"
                max="99"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Message (optional)</label>
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a message..."
                className="mt-1"
              />
            </div>
            <Button className="w-full" onClick={sendGift}>
              Send {quantity}x {selectedGift.name} (${selectedGift.price * quantity})
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}