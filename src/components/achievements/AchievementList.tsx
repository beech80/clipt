import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AchievementItem from './AchievementItem';
import { achievementService } from '@/services/achievementService';
import { useAuth } from '@/contexts/AuthContext';

type AchievementListProps = { userId: string; gameId?: number };
const categories = ['daily', 'streaming', 'social', 'general'] as const;

export default function AchievementList({ userId, gameId }: AchievementListProps) {
  const { user } = useAuth();
  const [category, setCategory] = useState<string | null>(null);
  const result = useQuery({
    queryKey: ['user-achievements', user?.id, userId],
    queryFn: () => achievementService.getUserAchievements(userId),
    enabled: Boolean(userId) && user?.id === userId && gameId === undefined,
    retry: false,
  });
  // The legacy game service returns demo counts, not provider evidence.
  if (gameId !== undefined) return <p role="status">Verified game achievements are not connected yet.</p>;
  if (!userId) return <p role="status">Choose a profile to view achievements.</p>;
  if (user?.id !== userId) return <p role="status">Achievement progress is private. Only the account owner can view it.</p>;
  if (result.isPending) return <p role="status">Loading achievements…</p>;
  if (result.isError) return <div role="alert" className="space-y-3"><p>Achievements could not be loaded.</p><Button onClick={() => void result.refetch()}>Retry achievements</Button></div>;
  const achievements = (result.data ?? []).filter(row => !category || row.achievement.category === category);
  return <section className="space-y-4" aria-label="Real achievement progress">
    <div className="clipt-profile-tabs" aria-label="Achievement categories">
      <Button variant="outline" aria-pressed={category === null} onClick={() => setCategory(null)}>All</Button>
      {categories.map(value => <Button key={value} variant="outline" aria-pressed={category === value} onClick={() => setCategory(value)} className="capitalize">{value}</Button>)}
    </div>
    {achievements.length ? <div className="clipt-achievements-grid">{achievements.map(row => <AchievementItem key={row.id} achievement={row.achievement} progress={row} />)}</div> :
      <div className="gaming-card p-8 text-center"><Trophy className="mx-auto mb-3 text-purple-400" aria-hidden="true" /><p>No recorded achievements{category ? ' in this category' : ''} yet.</p></div>}
  </section>;
}
