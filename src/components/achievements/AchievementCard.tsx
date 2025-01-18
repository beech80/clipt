import { Trophy } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AchievementChain } from './AchievementChain';

interface AchievementCardProps {
  name: string;
  description: string;
  iconUrl?: string;
  points: number;
  earnedAt?: string;
  className?: string;
  achievementId: string;
  showChain?: boolean;
}

export const AchievementCard = ({
  name,
  description,
  iconUrl,
  points,
  earnedAt,
  className,
  achievementId,
  showChain = false,
}: AchievementCardProps) => {
  return (
    <div className="space-y-4">
      <Card className={cn("p-4 transition-all hover:border-gaming-500", className)}>
        <div className="flex items-center gap-4">
          {iconUrl ? (
            <img src={iconUrl} alt={name} className="w-8 h-8" />
          ) : (
            <Trophy className="w-8 h-8 text-gaming-400" />
          )}
          <div className="flex-1">
            <h3 className="font-semibold gaming-gradient">{name}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
            {earnedAt && (
              <p className="text-xs text-muted-foreground mt-1">
                Earned on {new Date(earnedAt).toLocaleDateString()}
              </p>
            )}
          </div>
          {points > 0 && (
            <div className="text-right">
              <span className="text-sm font-medium text-gaming-400">
                {points} pts
              </span>
            </div>
          )}
        </div>
      </Card>
      {showChain && <AchievementChain achievementId={achievementId} />}
    </div>
  );
};