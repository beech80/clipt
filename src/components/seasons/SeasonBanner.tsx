import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Calendar, Star } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";

export const SeasonBanner = () => {
  const { data: activeSeason } = useQuery({
    queryKey: ['active-season'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seasons')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: multiplier } = useQuery({
    queryKey: ['season-multiplier'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('active_season_multiplier')
        .select('current_multiplier')
        .single();

      if (error) throw error;
      return data;
    },
  });

  if (!activeSeason) return null;

  const now = new Date();
  const endDate = new Date(activeSeason.end_date);
  const startDate = new Date(activeSeason.start_date);
  const progress = ((now.getTime() - startDate.getTime()) / (endDate.getTime() - startDate.getTime())) * 100;

  return (
    <Card className="p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg">{activeSeason.name}</h3>
            <p className="text-sm text-muted-foreground">{activeSeason.description}</p>
          </div>
          <div className="flex items-center gap-1 text-yellow-500">
            <Star className="w-4 h-4" />
            <span className="font-medium">{multiplier?.current_multiplier}x XP</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Season Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>Ends {formatDistanceToNow(endDate, { addSuffix: true })}</span>
        </div>
      </div>
    </Card>
  );
};