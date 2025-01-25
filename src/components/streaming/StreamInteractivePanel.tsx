import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StreamChat } from './interactive/StreamChat';
import { StreamPoll } from './interactive/StreamPoll';
import { StreamHighlights } from './interactive/StreamHighlights';
import { MessageSquare, BarChart2, Bookmark } from 'lucide-react';

interface StreamInteractivePanelProps {
  streamId: string;
  isLive: boolean;
}

export const StreamInteractivePanel = ({ streamId, isLive }: StreamInteractivePanelProps) => {
  return (
    <Tabs defaultValue="chat" className="h-full flex flex-col">
      <TabsList>
        <TabsTrigger value="chat" className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Chat
        </TabsTrigger>
        <TabsTrigger value="polls" className="flex items-center gap-2">
          <BarChart2 className="h-4 w-4" />
          Polls
        </TabsTrigger>
        <TabsTrigger value="highlights" className="flex items-center gap-2">
          <Bookmark className="h-4 w-4" />
          Highlights
        </TabsTrigger>
      </TabsList>

      <TabsContent value="chat" className="flex-1">
        <StreamChat streamId={streamId} isLive={isLive} />
      </TabsContent>

      <TabsContent value="polls" className="flex-1 p-4">
        <StreamPoll streamId={streamId} />
      </TabsContent>

      <TabsContent value="highlights" className="flex-1 p-4">
        <StreamHighlights streamId={streamId} />
      </TabsContent>
    </Tabs>
  );
};