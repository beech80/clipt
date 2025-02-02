import { ViewerChallenges } from '@/components/challenges/ViewerChallenges';
import GameBoyControls from '@/components/GameBoyControls';

export default function Home() {
  return (
    <div className="container mx-auto p-6 space-y-8 pb-40">
      <ViewerChallenges />
      <GameBoyControls />
    </div>
  );
}