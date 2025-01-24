import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface BroadcastEngineControlsProps {
  streamId: string;
  engineStatus: 'idle' | 'starting' | 'active' | 'error';
  onEngineStart: () => void;
  onEngineStop: () => void;
  isConfigLoaded: boolean;
}

export const BroadcastEngineControls = ({
  engineStatus,
  onEngineStart,
  onEngineStop,
  isConfigLoaded
}: BroadcastEngineControlsProps) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-2xl font-bold">Broadcast Engine</h2>
      <Button
        onClick={engineStatus === 'active' ? onEngineStop : onEngineStart}
        variant={engineStatus === 'active' ? "destructive" : "default"}
        disabled={engineStatus === 'starting' || !isConfigLoaded}
      >
        {engineStatus === 'active' ? 'Stop Engine' : 'Start Engine'}
      </Button>
    </div>
  );
};