
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { StreamControls } from './StreamControls';
import { StreamSettings } from './StreamSettings';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { StreamHealthIndicator } from './StreamHealthIndicator';
import { StreamOverlay } from './overlay/StreamOverlay';
import { StreamAlerts } from './alerts/StreamAlerts';
import { StreamWidgets } from './widgets/StreamWidgets';
import { MultiPlatformManager } from './platforms/MultiPlatformManager';
import { AdvancedChatSettings } from './chat/AdvancedChatSettings';

interface StreamContainerProps {
  userId: string;
  isLive: boolean;
  streamConfig: any;
  onStreamUpdate: (data: any) => void;
}

export const StreamContainer = ({ 
  userId, 
  isLive, 
  streamConfig,
  onStreamUpdate 
}: StreamContainerProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const { data: stream } = useQuery({
    queryKey: ['stream', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('streams')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-4">
          <Input
            placeholder="Stream Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            placeholder="Stream Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <StreamControls
            userId={userId}
            streamId={stream?.id}
            isLive={isLive}
            title={title}
            description={description}
            onStreamStateChange={() => onStreamUpdate({ title, description })}
          />
          <StreamHealthIndicator streamId={stream?.id} />
        </div>
      </Card>

      <StreamSettings userId={userId} />
      <StreamOverlay userId={userId} />
      <StreamAlerts userId={userId} />
      <StreamWidgets userId={userId} />
      <MultiPlatformManager userId={userId} />
      <AdvancedChatSettings userId={userId} />
    </div>
  );
};
