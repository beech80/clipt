import { useAuth } from '@/contexts/AuthContext';
import { InteractiveOverlay } from './InteractiveOverlay';
import { StreamMiniGame } from './StreamMiniGame';
import { InteractionTracker } from './InteractionTracker';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gamepad, Activity } from 'lucide-react';

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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="game" className="flex items-center gap-2">
            <Gamepad className="h-4 w-4" />
            Mini-Games
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

        {isStreamer && (
          <TabsContent value="analytics">
            <InteractionTracker streamId={streamId} />
          </TabsContent>
        )}
      </Tabs>
    </Card>
  );
}