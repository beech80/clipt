import PubNub from 'pubnub';
import { supabase } from '@/lib/supabase';

let pubnubInstance: PubNub | null = null;

export const initializePubNub = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    console.error('No user session found');
    return null;
  }

  pubnubInstance = new PubNub({
    publishKey: 'PUBNUB_PUBLISH_KEY',
    subscribeKey: 'PUBNUB_SUBSCRIBE_KEY',
    userId: session.user.id,
    heartbeatInterval: 30,
  });

  return pubnubInstance;
};

export const getPubNub = () => {
  if (!pubnubInstance) {
    throw new Error('PubNub not initialized');
  }
  return pubnubInstance;
};

export const cleanupPubNub = () => {
  if (pubnubInstance) {
    pubnubInstance.unsubscribeAll();
    pubnubInstance = null;
  }
};

// Utility functions for common PubNub operations
export const publishMessage = async (channel: string, message: any) => {
  const pubnub = getPubNub();
  return await pubnub.publish({
    channel,
    message,
  });
};

export const subscribeToChannel = (
  channel: string, 
  callback: (message: any) => void
) => {
  const pubnub = getPubNub();
  
  pubnub.subscribe({
    channels: [channel],
    withPresence: true,
  });

  pubnub.addListener({
    message: (event) => {
      if (event.channel === channel) {
        callback(event.message);
      }
    },
    presence: (event) => {
      console.log('Presence event:', event);
    },
  });

  return () => {
    pubnub.unsubscribe({
      channels: [channel],
    });
  };
};