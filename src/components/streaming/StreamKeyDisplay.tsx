
import React from 'react';
import { Stream } from "@/types/stream";
import { StreamKeyManager } from './keys/StreamKeyManager';

interface StreamKeyDisplayProps {
  stream: Stream | null;
  userId: string;
}

export function StreamKeyDisplay({ userId }: StreamKeyDisplayProps) {
  if (!userId) return null;

  return <StreamKeyManager userId={userId} />;
}
