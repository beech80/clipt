import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StreamPoll } from "./polls/StreamPoll";
import { StreamQuiz } from "./quizzes/StreamQuiz";

interface StreamInteractivePanelProps {
  streamId: string;
  isStreamer: boolean;
}

export const StreamInteractivePanel = ({
  streamId,
  isStreamer,
}: StreamInteractivePanelProps) => {
  const [activePoll, setActivePoll] = useState<string | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<string | null>(null);

  return (
    <Card className="p-4">
      <Tabs defaultValue="polls" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="polls">Polls</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
        </TabsList>
        <TabsContent value="polls" className="space-y-4">
          {activePoll ? (
            <StreamPoll streamId={streamId} pollId={activePoll} />
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground">No active polls</p>
              {isStreamer && (
                <Button variant="outline" className="mt-2">
                  Create Poll
                </Button>
              )}
            </div>
          )}
        </TabsContent>
        <TabsContent value="quizzes" className="space-y-4">
          {activeQuiz ? (
            <StreamQuiz streamId={streamId} quizId={activeQuiz} />
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground">No active quizzes</p>
              {isStreamer && (
                <Button variant="outline" className="mt-2">
                  Create Quiz
                </Button>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
};