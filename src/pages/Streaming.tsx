import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { StreamForm } from "@/components/streaming/StreamForm";
import { StreamPreview } from "@/components/streaming/StreamPreview";
import { StreamChat } from "@/components/streaming/StreamChat";
import { StreamControls } from "@/components/streaming/StreamControls";
import { StreamHealthMonitor } from "@/components/streaming/StreamHealthMonitor";
import { StreamInfoCards } from "@/components/streaming/StreamInfoCards";
import { StreamSettingsForm } from "@/components/streaming/StreamSettingsForm";
import { useQuery } from "@tanstack/react-query";

const Streaming = () => {
  const { user } = useAuth();
  const [isConfiguring, setIsConfiguring] = useState(false);

  const { data: stream } = useQuery({
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
    enabled: !!user?.id
  });

  useEffect(() => {
    if (!stream) {
      setIsConfiguring(true);
    }
  }, [stream]);

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {isConfiguring ? (
        <StreamForm onComplete={() => setIsConfiguring(false)} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <StreamPreview 
              streamUrl={stream?.stream_url} 
              isLive={stream?.is_live} 
            />
            <StreamControls />
            <StreamHealthMonitor />
          </div>
          
          <div className="space-y-6">
            <StreamInfoCards />
            <StreamChat 
              streamId={stream?.id || ''} 
              isLive={stream?.is_live || false} 
            />
            <StreamSettingsForm />
          </div>
        </div>
      )}
    </div>
  );
}

export default Streaming;