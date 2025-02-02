import { ViewerChallenges } from '@/components/challenges/ViewerChallenges';
import { ActiveStreams } from '@/components/streaming/ActiveStreams';
import { FeaturedContent } from '@/components/content/FeaturedContent';
import { CommunityHighlights } from '@/components/community/CommunityHighlights';
import { UpcomingEvents } from '@/components/events/UpcomingEvents';
import { GameBoyControls } from '@/components/GameBoyControls';

export default function Home() {
  return (
    <div className="container mx-auto p-6 space-y-8 pb-40">
      <ViewerChallenges />
      <ActiveStreams />
      <FeaturedContent />
      <div className="grid gap-8 md:grid-cols-2">
        <CommunityHighlights />
        <UpcomingEvents />
      </div>
      <GameBoyControls />
    </div>
  );
}