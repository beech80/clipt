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
import { Settings, Filter, Smile, UserX, BarChart } from 'lucide-react';
import '@/styles/streaming.css';

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
    <Card className="p-4 sm:p-6">
      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList className="w-full moderation-tabs overflow-x-auto flex flex-nowrap justify-start sm:justify-center p-1 pb-2 gap-1">
          <TabsTrigger value="settings" className="flex items-center whitespace-nowrap">
            <Settings className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
          <TabsTrigger value="filters" className="flex items-center whitespace-nowrap">
            <Filter className="h-4 w-4 mr-1 sm:mr-2" /> 
            <span className="hidden sm:inline">Filters</span>
          </TabsTrigger>
          <TabsTrigger value="emotes" className="flex items-center whitespace-nowrap">
            <Smile className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Emotes</span>
          </TabsTrigger>
          <TabsTrigger value="banned" className="flex items-center whitespace-nowrap">
            <UserX className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Banned Users</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center whitespace-nowrap">
            <BarChart className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
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
