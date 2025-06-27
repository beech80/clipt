import React, { useState, useEffect } from 'react';
import { Container } from '@/components/ui/container';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { NotificationPreferences } from '@/components/NotificationPreferences';
import { pushNotificationService } from '@/services/notificationService';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useUser } from '@/hooks/useAuth';
import { Bell } from 'lucide-react';

export default function NotificationDemo() {
  const { user } = useUser();
  const [title, setTitle] = useState('Test Notification');
  const [body, setBody] = useState('This is a test push notification from Clipt!');
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Check push notification support on mount
  useEffect(() => {
    const supported = pushNotificationService.isSupported();
    setIsSupported(supported);

    if (supported) {
      // Check if already subscribed
      navigator.serviceWorker.ready.then(registration => {
        return registration.pushManager.getSubscription();
      }).then(subscription => {
        setIsSubscribed(!!subscription);
      });
    }
  }, []);

  // Send a test push notification
  const sendTestNotification = async () => {
    if (!user?.id) {
      toast.error('You must be logged in to send notifications');
      return;
    }

    try {
      setIsSending(true);
      
      const response = await fetch('/api/send-push-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          title,
          body,
          url: window.location.href,
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to send notification');
      }

      toast.success('Test notification sent successfully!');
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send notification');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Container className="py-10">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <Bell className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Push Notification Demo</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Notification Status</CardTitle>
            <CardDescription>Current push notification settings for your browser</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Browser Support:</span>
                <Badge variant={isSupported ? "success" : "destructive"}>
                  {isSupported ? "Supported" : "Not Supported"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Subscription Status:</span>
                <Badge variant={isSubscribed ? "success" : "default"}>
                  {isSubscribed ? "Subscribed" : "Not Subscribed"}
                </Badge>
              </div>
              
              <NotificationPreferences className="mt-4" />
            </div>
          </CardContent>
        </Card>

        {isSupported && (
          <Card>
            <CardHeader>
              <CardTitle>Send Test Notification</CardTitle>
              <CardDescription>Create and send yourself a test notification</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-medium">Notification Title</label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter notification title"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="body" className="text-sm font-medium">Notification Body</label>
                  <Textarea
                    id="body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Enter notification content"
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={sendTestNotification} 
                disabled={isSending || !isSubscribed || !user}
                className="w-full"
              >
                {isSending ? 'Sending...' : 'Send Test Notification'}
              </Button>
            </CardFooter>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
            <CardDescription>Understanding the push notification system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <p>
                This push notification system uses the Web Push API with Supabase as the backend. Here's how it works:
              </p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>User subscribes to notifications using the browser's Push API</li>
                <li>Subscription details are stored securely in your Supabase database</li>
                <li>When an event happens (stream goes live, comment received, etc.), the app sends a push notification</li>
                <li>The notification is delivered via our service worker even when the app is closed</li>
                <li>Clicking the notification brings the user back to the relevant page in the app</li>
              </ol>
              <p className="mt-4">
                Push notifications work on desktop and mobile browsers that support the Web Push API.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
