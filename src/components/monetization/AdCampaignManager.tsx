import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { toast } from "sonner";
import { DollarSign, TrendingUp, Calendar } from "lucide-react";

interface AdCampaign {
  id: string;
  name: string;
  description: string;
  budget: number;
  daily_spend_limit: number;
  start_date: string;
  end_date: string | null;
  status: string;
}

export function AdCampaignManager() {
  const queryClient = useQueryClient();
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    description: "",
    budget: 0,
    daily_spend_limit: 0,
    start_date: "",
    end_date: "",
  });

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["ad-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_campaigns")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as AdCampaign[];
    },
  });

  const createCampaign = useMutation({
    mutationFn: async (campaign: typeof newCampaign) => {
      const { error } = await supabase.from("ad_campaigns").insert([{
        ...campaign,
        user_id: (await supabase.auth.getUser()).data.user?.id,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ad-campaigns"] });
      toast.success("Campaign created successfully!");
      setNewCampaign({
        name: "",
        description: "",
        budget: 0,
        daily_spend_limit: 0,
        start_date: "",
        end_date: "",
      });
    },
    onError: () => {
      toast.error("Failed to create campaign");
    },
  });

  if (isLoading) {
    return <div>Loading campaigns...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Create Campaign</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            placeholder="Campaign Name"
            value={newCampaign.name}
            onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
          />
          <Input
            type="number"
            placeholder="Budget"
            value={newCampaign.budget}
            onChange={(e) =>
              setNewCampaign({ ...newCampaign, budget: parseFloat(e.target.value) })
            }
          />
          <Input
            type="number"
            placeholder="Daily Spend Limit"
            value={newCampaign.daily_spend_limit}
            onChange={(e) =>
              setNewCampaign({
                ...newCampaign,
                daily_spend_limit: parseFloat(e.target.value),
              })
            }
          />
          <Input
            type="date"
            placeholder="Start Date"
            value={newCampaign.start_date}
            onChange={(e) =>
              setNewCampaign({ ...newCampaign, start_date: e.target.value })
            }
          />
          <Input
            type="date"
            placeholder="End Date"
            value={newCampaign.end_date}
            onChange={(e) =>
              setNewCampaign({ ...newCampaign, end_date: e.target.value })
            }
          />
          <Textarea
            placeholder="Campaign Description"
            value={newCampaign.description}
            onChange={(e) =>
              setNewCampaign({ ...newCampaign, description: e.target.value })
            }
            className="md:col-span-2"
          />
        </div>
        <Button
          className="mt-4"
          onClick={() => createCampaign.mutate(newCampaign)}
        >
          Create Campaign
        </Button>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {campaigns?.map((campaign) => (
          <Card key={campaign.id} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{campaign.name}</h3>
              <Badge
                variant={campaign.status === "active" ? "default" : "secondary"}
              >
                {campaign.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {campaign.description}
            </p>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 mr-1" />
                ${campaign.budget}
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {new Date(campaign.start_date).toLocaleDateString()}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}