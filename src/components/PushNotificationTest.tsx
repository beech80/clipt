import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import pushNotificationService from '@/services/notificationService';
import { toast } from 'sonner';

export default function PushNotificationTest() {
  const { user } = useAuth();
  const [status, setStatus] = useState<'default' | 'subscribed' | 'denied'>('default');
  const [isLoading, setIsLoading] = useState(false);
  const [topic, setTopic] = useState('general');
  const [notificationTitle, setNotificationTitle] = useState('Test Notification');
  const [notificationMessage, setNotificationMessage] = useState('This is a test notification');

  useEffect(() => {
    // Check current permission status
    const checkPermission = async () => {
      if (!('Notification' in window)) {
        setStatus('denied');
        return;
      }
      
      if (Notification.permission === 'granted') {
        // Check if we actually have a subscription
        const hasSubscription = await pushNotificationService.hasActiveSubscription();
        setStatus(hasSubscription ? 'subscribed' : 'default');
      } else if (Notification.permission === 'denied') {
        setStatus('denied');
      }
    };
    
    checkPermission();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      setIsChecking(true);
      // First check for online status
      if (!navigator.onLine) {
        toast.error('You are offline. Please check your internet connection.');
        setIsChecking(false);
        return;
      }

      // Check if the browser supports push notifications
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setIsSupported(false);
        setIsChecking(false);
        return;
      }

      setIsSupported(true);
      
      // Check if service worker is registered
      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Service Worker registration timed out')), 5000)
        )
      ]);
      
      // Check if there is an existing subscription
      const existingSub = await registration.pushManager.getSubscription();
      
      if (existingSub) {
        setSubscription(existingSub);
        setIsSubscribed(true);
        await fetchUserPreferences();
      } else {
        setIsSubscribed(false);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      if (error.message === 'Service Worker registration timed out') {
        toast.error('Service worker registration timed out. Please refresh the page and try again.');
      } else if (error.name === 'NotAllowedError') {
        toast.error('Permission to send notifications was denied');
      } else if (error.message && error.message.includes('network')) {
        toast.error('Network error. Please check your internet connection and try again.');
      } else {
        toast.error('Failed to check notification status');
      }
    } finally {
      setIsChecking(false);
    }
  };

  const handleSubscribe = async () => {
    if (!user) {
      toast.error('You must be logged in to subscribe to notifications');
      return;
    }

    setIsLoading(true);
    try {
      const result = await pushNotificationService.subscribe(user.id);
      if (result.success) {
        setStatus('subscribed');
        toast.success('Successfully subscribed to push notifications');
      } else {
        toast.error(result.error || 'Failed to subscribe to notifications');
      }
    } catch (error) {
      console.error('Subscribe error:', error);
      if (error.message && error.message.includes('network')) {
        toast.error('Network error. Please check your internet connection and try again.');
      } else {
        toast.error('An error occurred while subscribing');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const result = await pushNotificationService.unsubscribe();
      if (result.success) {
        setStatus('default');
        toast.success('Successfully unsubscribed from notifications');
      } else {
        toast.error('Failed to unsubscribe from notifications');
      }
    } catch (error) {
      console.error('Unsubscribe error:', error);
      toast.error('An error occurred while unsubscribing');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendTestNotification = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const result = await pushNotificationService.sendNotification({
        userIds: [user.id],
        title: notificationTitle,
        body: notificationMessage,
        icon: '/icons/icon-512x512.png',
        badge: '/icons/badge-128x128.png',
        url: '/dashboard',
        topic: topic,
        requireInteraction: true,
        data: {
          testData: 'This is test data',
          timestamp: new Date().toISOString()
        }
      });
      
      if (result.success) {
        toast.success('Test notification sent successfully');
      } else {
        toast.error('Failed to send test notification');
      }
    } catch (error) {
      console.error('Send notification error:', error);
      toast.error('An error occurred while sending the notification');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePreference = async (topic: string, enabled: boolean) => {
    try {
      setIsUpdating(true);
      // Update the topic preference directly in Supabase
      const { error } = await supabase
        .from('push_subscriptions')
        .update({
          preferences: {
            ...userPreferences,
            [topic]: enabled
          }
        })
        .eq('user_id', user?.id!);
        
      if (error) throw error;
      
      await fetchUserPreferences();
      toast.success(`Notification preference updated`);
    } catch (error) {
      console.error('Error updating preference:', error);
      toast.error('Failed to update notification preference');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-4 space-y-6 max-w-lg mx-auto">
      <h2 className="text-2xl font-bold">Push Notification Test Panel</h2>
      
      <div className="p-4 border rounded-lg bg-slate-50">
        <h3 className="text-lg font-semibold mb-3">Notification Status</h3>
        <div className="flex items-center justify-between">
          <span>
            {status === 'denied' && '❌ Notifications blocked by browser'}
            {status === 'default' && '⚠️ Not subscribed to notifications'}
            {status === 'subscribed' && '✅ Subscribed to notifications'}
          </span>
          
          {status === 'default' && Notification.permission !== 'denied' && (
            <button 
              onClick={handleSubscribe} 
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : 'Subscribe'}
            </button>
          )}
          
          {status === 'subscribed' && (
            <button 
              onClick={handleUnsubscribe} 
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : 'Unsubscribe'}
            </button>
          )}
        </div>
      </div>
      
      {status === 'subscribed' && (
        <>
          <div className="p-4 border rounded-lg bg-slate-50">
            <h3 className="text-lg font-semibold mb-3">Topic Preferences</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>General Notifications</span>
                <div>
                  <button 
                    onClick={() => handleUpdatePreference('general', true)}
                    className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 mr-2 text-sm"
                  >
                    Enable
                  </button>
                  <button 
                    onClick={() => handleUpdatePreference('general', false)}
                    className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                  >
                    Disable
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Content Updates</span>
                <div>
                  <button 
                    onClick={() => handleUpdatePreference('content', true)}
                    className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 mr-2 text-sm"
                  >
                    Enable
                  </button>
                  <button 
                    onClick={() => handleUpdatePreference('content', false)}
                    className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                  >
                    Disable
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Social Interactions</span>
                <div>
                  <button 
                    onClick={() => handleUpdatePreference('social', true)}
                    className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 mr-2 text-sm"
                  >
                    Enable
                  </button>
                  <button 
                    onClick={() => handleUpdatePreference('social', false)}
                    className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                  >
                    Disable
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border rounded-lg bg-slate-50">
            <h3 className="text-lg font-semibold mb-3">Send Test Notification</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Topic</label>
                <select 
                  value={topic} 
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="general">General</option>
                  <option value="content">Content</option>
                  <option value="social">Social</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input 
                  type="text" 
                  value={notificationTitle} 
                  onChange={(e) => setNotificationTitle(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Message</label>
                <textarea 
                  value={notificationMessage} 
                  onChange={(e) => setNotificationMessage(e.target.value)}
                  className="w-full p-2 border rounded"
                  rows={3}
                />
              </div>
              
              <button 
                onClick={handleSendTestNotification} 
                disabled={isLoading}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                {isLoading ? 'Sending...' : 'Send Test Notification'}
              </button>
            </div>
          </div>
        </>
      )}
      
      {status === 'denied' && (
        <div className="p-4 border border-red-200 rounded-lg bg-red-50 text-red-700">
          <p>You have blocked notifications in your browser. To enable notifications:</p>
          <ol className="list-decimal ml-5 mt-2">
            <li>Click the lock/info icon in your address bar</li>
            <li>Find "Notifications" permissions</li>
            <li>Change the setting to "Allow"</li>
            <li>Refresh this page</li>
          </ol>
        </div>
      )}
    </div>
  );
}
