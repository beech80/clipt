import React, { useState } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { StreamForm } from "@/components/streaming/StreamForm";
import StreamPreview from "@/components/streaming/StreamPreview";
import { StreamSettings } from "@/components/streaming/StreamSettings";
import { StreamChat } from "@/components/streaming/StreamChat";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

const Streaming = () => {
  const { user } = useAuth();
  const [activeStream, setActiveStream] = useState<any>(null);

  const { data: stream, isLoading } = useQuery({
    queryKey: ['stream', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('streams')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gaming-400" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Tabs defaultValue="preview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <StreamPreview
                streamUrl={stream?.stream_url}
                className="aspect-video"
                onGoLive={() => {
                  // Handle go live logic
                }}
              />
            </div>
            <div>
              <StreamForm
                title={stream?.title || ''}
                description={stream?.description || ''}
                onTitleChange={() => {}}
                onDescriptionChange={() => {}}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          {user && <StreamSettings userId={user.id} />}
        </TabsContent>

        <TabsContent value="chat">
          <StreamChat streamId={stream?.id} isLive={stream?.is_live} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Streaming;