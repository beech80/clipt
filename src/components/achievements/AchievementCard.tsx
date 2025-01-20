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
      <Card className={cn(
        "p-6 transition-all hover:border-gaming-500 gaming-card", 
        earnedAt ? "bg-gradient-to-br from-gaming-900/50 to-gaming-800/50" : "opacity-75",
        className
      )}>
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            {iconUrl ? (
              <img src={iconUrl} alt={name} className="w-12 h-12" />
            ) : (
              <Trophy className="w-12 h-12 text-gaming-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold gaming-gradient text-lg truncate">{name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
            {earnedAt && (
              <p className="text-xs text-muted-foreground mt-1">
                Earned on {new Date(earnedAt).toLocaleDateString()}
              </p>
            )}
          </div>
          {points > 0 && (
            <div className="flex-shrink-0 text-right">
              <span className="text-sm font-medium gaming-gradient">
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