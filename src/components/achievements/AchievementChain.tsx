import { Card } from '@/components/ui/card';
import { Trophy, ArrowRight } from 'lucide-react';
import { useAchievementData } from '@/hooks/useAchievementData';
import { useAuth } from '@/contexts/AuthContext';

export const AchievementChain = ({ achievementId }: { achievementId: string }) => {
  const { user } = useAuth();
  const { data: achievements } = useAchievementData(user?.id || '');

  const getChainedAchievements = (id: string): any[] => {
    const achievement = achievements?.find(a => a.id === id);
    if (!achievement) return [];

    const chainedAchievements = achievements?.filter(
      a => a.chain_requirement?.id === id
    ) || [];

    return [
      achievement,
      ...chainedAchievements.flatMap(a => getChainedAchievements(a.id)),
    ];
  };

  const chain = getChainedAchievements(achievementId);

  if (!chain.length) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Achievement Chain</h3>
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {chain.map((achievement, index) => (
          <div key={achievement.id} className="flex items-center gap-2">
            <Card className="p-3 min-w-[200px]">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-gaming-400" />
                <div>
                  <p className="font-medium">{achievement.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {achievement.description}
                  </p>
                </div>
              </div>
            </Card>
            {index < chain.length - 1 && (
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};