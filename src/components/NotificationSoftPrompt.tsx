import React, { useState } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { toast } from 'sonner';
import { useUser } from '@/hooks/useUser';
import { supabase } from '@/supabaseClient';
import { notificationAnalyticsService } from '@/services/notificationAnalyticsService';

interface NotificationSoftPromptProps {
  type: 'stream' | 'message' | 'general';
  onClose: () => void;
  streamId?: string;
  channelId?: string;
}

/**
 * A "soft ask" prompt for notification permissions
 * Shows users the value before triggering browser permission prompt
 */
const NotificationSoftPrompt: React.FC<NotificationSoftPromptProps> = ({
  type,
  onClose,
  streamId,
  channelId
}) => {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  
  // Get the appropriate messaging based on context
  const getPromptContent = () => {
    switch (type) {
      case 'stream':
        return {
          title: 'Never miss a stream',
          description: 'Get notified when this streamer goes live so you never miss their content.',
          allowLabel: 'Notify me when live',
          icon: Bell
        };
      case 'message':
        return {
          title: 'Stay in touch',
          description: 'Get notified when you receive new messages so you can respond quickly.',
          allowLabel: 'Enable message alerts',
          icon: Bell
        };
      default:
        return {
          title: 'Enable notifications',
          description: 'Stay updated with important activity from your favorite streamers and friends.',
          allowLabel: 'Enable notifications',
          icon: Bell
        };
    }
  };
  
  const content = getPromptContent();
  
  // Store the user's preference not to be asked again
  const handleDontAskAgain = async () => {
    if (!user) return;
    
    try {
      await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          dont_ask_notifications: true
        }, { onConflict: 'user_id' });
      
      onClose();
    } catch (error) {
      console.error('Error saving preference:', error);
    }
  };
  
  // Handle when user agrees to enable notifications
  const handleEnable = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      // Check if notifications are already supported and permission granted
      if (!('Notification' in window)) {
        toast.error('Notifications are not supported in this browser');
        return;
      }
      
      // Request permission
      const permission = await Notification.requestPermission();
      
      // Track the permission result
      await notificationAnalyticsService.trackPermission(user.id, permission);
      
      if (permission === 'granted') {
        // Register service worker if needed
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          
          // Subscribe to push notifications
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(
              import.meta.env.VITE_VAPID_PUBLIC_KEY || ''
            )
          });
          
          // Save subscription to server
          const { error } = await supabase.from('push_subscriptions').insert({
            user_id: user.id,
            endpoint: subscription.endpoint,
            auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))),
            p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
            preferences: {
              // Enable specific topic based on context
              [type]: true,
              ...(streamId ? { [`stream_${streamId}`]: true } : {}),
              ...(channelId ? { [`channel_${channelId}`]: true } : {})
            }
          });
          
          if (error) throw error;
          
          // Track successful subscription
          await notificationAnalyticsService.trackSubscription(
            user.id, 
            true,
            type === 'stream' && streamId ? `stream_${streamId}` : type
          );
          
          toast.success('Notifications enabled successfully!');
        }
      } else {
        toast.error('Permission to send notifications was denied');
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      toast.error('Failed to enable notifications');
      
      // Track failed subscription
      await notificationAnalyticsService.trackSubscription(
        user.id, 
        false,
        type === 'stream' && streamId ? `stream_${streamId}` : type
      );
    } finally {
      setLoading(false);
      onClose();
    }
  };
  
  // Helper function to convert VAPID key
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  };

  return (
    <Card className="p-4 relative border shadow-lg max-w-md w-full">
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute top-2 right-2" 
        onClick={onClose}
      >
        <X size={16} />
      </Button>
      
      <div className="flex items-start space-x-4 pt-2">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <content.icon className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{content.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {content.description}
          </p>
          <div className="mt-4 flex justify-between items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={loading}
            >
              Maybe later
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleEnable}
              disabled={loading}
            >
              {loading ? 'Enabling...' : content.allowLabel}
            </Button>
          </div>
          <button
            className="text-xs text-muted-foreground mt-3 hover:underline w-full text-center"
            onClick={handleDontAskAgain}
          >
            Don't ask again
          </button>
        </div>
      </div>
    </Card>
  );
};

export default NotificationSoftPrompt;
