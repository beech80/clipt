import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContentFilterList } from "./moderation/ContentFilterList";
import { ModeratorList } from "./moderation/ModeratorList";

interface StreamModerationProps {
  streamId: string;
}

export function StreamModeration({ streamId }: StreamModerationProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Stream Moderation</h2>
      </div>

      <Tabs defaultValue="moderators">
        <TabsList>
          <TabsTrigger value="moderators">Moderators</TabsTrigger>
          <TabsTrigger value="filters">Content Filters</TabsTrigger>
        </TabsList>
        <TabsContent value="moderators" className="mt-4">
          <ModeratorList streamId={streamId} />
        </TabsContent>
        <TabsContent value="filters" className="mt-4">
          <ContentFilterList />
        </TabsContent>
      </Tabs>
    </div>
  );
}