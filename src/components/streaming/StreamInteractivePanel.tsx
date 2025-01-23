import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StreamPoll } from "./polls/StreamPoll";
import { StreamQuiz } from "./quizzes/StreamQuiz";
import { VirtualGiftSelector } from "./gifts/VirtualGiftSelector";
import { GiftDisplay } from "./gifts/GiftDisplay";

interface StreamInteractivePanelProps {
  streamId: string;
  isLive: boolean;
}

export function StreamInteractivePanel({ streamId, isLive }: StreamInteractivePanelProps) {
  const [activeTab, setActiveTab] = useState("polls");

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Interactive Features</h3>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="polls">Polls</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
          <TabsTrigger value="gifts">Virtual Gifts</TabsTrigger>
        </TabsList>

        <TabsContent value="polls">
          <StreamPoll streamId={streamId} />
        </TabsContent>

        <TabsContent value="quizzes">
          <StreamQuiz streamId={streamId} />
        </TabsContent>

        <TabsContent value="gifts">
          <div className="grid gap-4">
            <VirtualGiftSelector streamId={streamId} isLive={isLive} />
            <GiftDisplay streamId={streamId} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}