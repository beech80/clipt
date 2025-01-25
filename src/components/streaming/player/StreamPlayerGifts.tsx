import React from 'react';
import { VirtualGiftSelector } from '@/components/gifts/VirtualGiftSelector';
import { VirtualGiftDisplay } from '@/components/gifts/VirtualGiftDisplay';

interface StreamPlayerGiftsProps {
  streamId: string;
  isLive: boolean;
}

export function StreamPlayerGifts({ streamId, isLive }: StreamPlayerGiftsProps) {
  return (
    <>
      <div className="absolute bottom-4 right-4 space-x-2">
        <VirtualGiftSelector streamId={streamId} isLive={isLive} />
      </div>
      <VirtualGiftDisplay streamId={streamId} />
    </>
  );
}