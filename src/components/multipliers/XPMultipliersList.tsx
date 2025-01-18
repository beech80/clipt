import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Percent } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";

export const XPMultipliersList = () => {
  const { data: multipliers } = useQuery({
    queryKey: ['xp-multipliers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('xp_multipliers')
        .select('*')
        .gt('end_time', new Date().toISOString())
        .order('end_time', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  if (!multipliers?.length) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Percent className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Active Multipliers</h3>
      </div>

      <div className="grid gap-4">
        {multipliers.map((multiplier) => (
          <Card key={multiplier.id} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{multiplier.reason}</p>
                <p className="text-sm text-muted-foreground">
                  Expires {formatDistanceToNow(new Date(multiplier.end_time), { addSuffix: true })}
                </p>
              </div>
              <span className="font-semibold text-primary">{multiplier.multiplier}x</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};