import { Progress } from "@/components/ui/progress";
import { Trophy } from "lucide-react";
import { useAchievementProgress } from "@/hooks/useAchievementProgress";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";

export const AchievementProgress = () => {
  const { user } = useAuth();
  const { progress, isLoading } = useAchievementProgress(user?.id || '');

  if (isLoading || !progress) {
    return null;
  }

  const inProgressAchievements = progress.filter(
    p => p.current_value < (p.achievement?.target_value || 0)
  );

  if (inProgressAchievements.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Trophy className="w-5 h-5 text-gaming-400" />
        <h3 className="font-semibold">Achievement Progress</h3>
      </div>
      
      <div className="space-y-4">
        {inProgressAchievements.map((p) => (
          <Card key={p.id} className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">{p.achievement?.name}</h4>
                <span className="text-sm text-muted-foreground">
                  {p.current_value} / {p.achievement?.target_value}
                </span>
              </div>
              <Progress 
                value={(p.current_value / (p.achievement?.target_value || 1)) * 100} 
                className="h-2"
              />
              <p className="text-sm text-muted-foreground">
                {p.achievement?.description}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};