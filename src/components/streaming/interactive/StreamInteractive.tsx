import { useAuth } from '@/contexts/AuthContext';
import { InteractiveOverlay } from './InteractiveOverlay';
import { StreamMiniGame } from './StreamMiniGame';
import { InteractionTracker } from './InteractionTracker';
import { StreamPoll } from './StreamPoll';
import { LiveReactions } from './LiveReactions';
import { CrowdChallenges } from './CrowdChallenges';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gamepad, BarChart2, ThumbsUp, Trophy } from 'lucide-react';
import { Activity } from '@/components/ui/icon-fix';

interface StreamInteractiveProps {
  streamId: string;
  isStreamer?: boolean;
}

export function StreamInteractive({ streamId, isStreamer = false }: StreamInteractiveProps) {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <Card className="p-4">
      <Tabs defaultValue="game" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="game" className="flex items-center gap-2">
            <Gamepad className="h-4 w-4" />
            Games
          </TabsTrigger>
          <TabsTrigger value="polls" className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            Polls
          </TabsTrigger>
          <TabsTrigger value="reactions" className="flex items-center gap-2">
            <ThumbsUp className="h-4 w-4" />
            Reactions
          </TabsTrigger>
          <TabsTrigger value="challenges" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Challenges
          </TabsTrigger>
          {isStreamer && (
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="game" className="space-y-4">
          <StreamMiniGame streamId={streamId} userId={user.id} />
          <InteractiveOverlay streamId={streamId} viewerId={user.id} />
        </TabsContent>

        <TabsContent value="polls" className="space-y-4">
          <StreamPoll streamId={streamId} />
        </TabsContent>

        <TabsContent value="reactions" className="space-y-4">
          <LiveReactions streamId={streamId} userId={user.id} />
        </TabsContent>

        <TabsContent value="challenges" className="space-y-4">
          <CrowdChallenges streamId={streamId} userId={user.id} />
        </TabsContent>

        {isStreamer && (
          <TabsContent value="analytics">
            <InteractionTracker streamId={streamId} />
          </TabsContent>
        )}
      </Tabs>
    </Card>
  );
}