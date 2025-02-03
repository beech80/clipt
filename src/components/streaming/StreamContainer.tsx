import React from 'react';
import { Card } from "@/components/ui/card";
import { StreamPlayer } from './StreamPlayer';
import { StreamControls } from './StreamControls';
import { StreamChat } from './StreamChat';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export function StreamContainer() {
  const { data: streamConfig, isLoading } = useQuery({
    queryKey: ['streamConfig'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('streaming_config')
        .select('*')
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  const { data: stream } = useQuery({
    queryKey: ['currentStream'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('streams')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      <div className="lg:col-span-3 space-y-4">
        <Card className="p-4">
          <StreamPlayer 
            streamUrl={stream?.stream_url}
            isLive={stream?.is_live}
            streamId={stream?.id}
          />
        </Card>
        
        <Card className="p-4">
          <StreamControls 
            streamConfig={streamConfig}
            stream={stream}
          />
        </Card>
      </div>

      <div className="lg:col-span-1">
        <Card className="h-[600px]">
          <StreamChat 
            streamId={stream?.id}
            isLive={stream?.is_live}
          />
        </Card>
      </div>
    </div>
  );
}