import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import { DollarSign, Layout } from "lucide-react";

interface AdPlacement {
  id: string;
  position: string;
  size: string;
  price_model: string;
  base_price: number;
}

export function SponsorshipManager({ streamId }: { streamId: string }) {
  const queryClient = useQueryClient();
  const [newPlacement, setNewPlacement] = useState({
    position: "",
    size: "",
    price_model: "cpm",
    base_price: 0,
  });

  const { data: placements, isLoading } = useQuery({
    queryKey: ["ad-placements", streamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_placements")
        .select("*")
        .eq("stream_id", streamId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as AdPlacement[];
    },
  });

  const createPlacement = useMutation({
    mutationFn: async (placement: typeof newPlacement) => {
      const { error } = await supabase
        .from("ad_placements")
        .insert([{ ...placement, stream_id: streamId }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ad-placements", streamId] });
      toast.success("Placement created successfully!");
      setNewPlacement({
        position: "",
        size: "",
        price_model: "cpm",
        base_price: 0,
      });
    },
    onError: () => {
      toast.error("Failed to create placement");
    },
  });

  if (isLoading) {
    return <div>Loading placements...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Create Ad Placement</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            placeholder="Position (e.g., overlay-top)"
            value={newPlacement.position}
            onChange={(e) =>
              setNewPlacement({ ...newPlacement, position: e.target.value })
            }
          />
          <Input
            placeholder="Size (e.g., 728x90)"
            value={newPlacement.size}
            onChange={(e) =>
              setNewPlacement({ ...newPlacement, size: e.target.value })
            }
          />
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={newPlacement.price_model}
            onChange={(e) =>
              setNewPlacement({ ...newPlacement, price_model: e.target.value })
            }
          >
            <option value="cpm">CPM (Cost per Mile)</option>
            <option value="cpc">CPC (Cost per Click)</option>
            <option value="flat">Flat Rate</option>
          </select>
          <Input
            type="number"
            placeholder="Base Price"
            value={newPlacement.base_price}
            onChange={(e) =>
              setNewPlacement({
                ...newPlacement,
                base_price: parseFloat(e.target.value),
              })
            }
          />
        </div>
        <Button
          className="mt-4"
          onClick={() => createPlacement.mutate(newPlacement)}
        >
          Create Placement
        </Button>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {placements?.map((placement) => (
          <Card key={placement.id} className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Layout className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold">{placement.position}</h3>
              </div>
              <span className="text-sm text-muted-foreground">
                {placement.size}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {placement.price_model.toUpperCase()}
              </span>
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 mr-1" />
                {placement.base_price}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}