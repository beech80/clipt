
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ChatFilterList } from './ChatFilterList';
import { ChatAnalytics } from './ChatAnalytics';
import { ChatSettings } from './ChatSettings';
import { BannedUsers } from './BannedUsers';
import { EmoteManager } from './EmoteManager';

interface ChatModerationDashboardProps {
  streamId: string;
}

export const ChatModerationDashboard = ({ streamId }: ChatModerationDashboardProps) => {
  const { data: stream } = useQuery({
    queryKey: ['stream', streamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('streams')
        .select('*')
        .eq('id', streamId)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  return (
    <Card className="p-6">
      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="filters">Filters</TabsTrigger>
          <TabsTrigger value="emotes">Emotes</TabsTrigger>
          <TabsTrigger value="banned">Banned Users</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <ChatSettings streamId={streamId} settings={stream?.chat_settings} />
        </TabsContent>

        <TabsContent value="filters">
          <ChatFilterList streamId={streamId} />
        </TabsContent>

        <TabsContent value="emotes">
          <EmoteManager streamId={streamId} />
        </TabsContent>

        <TabsContent value="banned">
          <BannedUsers streamId={streamId} />
        </TabsContent>

        <TabsContent value="analytics">
          <ChatAnalytics streamId={streamId} />
        </TabsContent>
      </Tabs>
    </Card>
  );
};
