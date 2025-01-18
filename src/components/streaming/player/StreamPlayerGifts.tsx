import React from 'react';
import { VirtualGiftSelector } from '../gifts/VirtualGiftSelector';
import { GiftDisplay } from '../gifts/GiftDisplay';

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
      <GiftDisplay streamId={streamId} />
    </>
  );
}