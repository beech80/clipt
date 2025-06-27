import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { useUser } from '@/hooks/useUser';
import { supabase } from '@/supabaseClient';
import { toast } from 'sonner';
import { Bell, BellOff, User, Clock, Shield } from 'lucide-react';
import NotificationSoftPrompt from './NotificationSoftPrompt';

interface UserPreferences {
  stream_notifications_enabled: boolean;
  live_stream_notifications: boolean;
  scheduled_stream_notifications: boolean;
  followed_streamers_only: boolean;
  stream_reminder_minutes: number;
  max_notifications_per_day: number;
}

const StreamNotificationSettings: React.FC = () => {
  const { user } = useUser();
  const [preferences, setPreferences] = useState<UserPreferences>({
    stream_notifications_enabled: true,
    live_stream_notifications: true,
    scheduled_stream_notifications: true,
    followed_streamers_only: true,
    stream_reminder_minutes: 10,
    max_notifications_per_day: 5
  });
  const [loading, setLoading] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

  useEffect(() => {
    // Check notification permission status
    if (Notification) {
      setPermissionGranted(Notification.permission === 'granted');
    }
    
    // Load user preferences
    const loadPreferences = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('user_notification_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        
        if (data) {
          setPreferences({
            stream_notifications_enabled: data.stream_notifications_enabled ?? true,
            live_stream_notifications: data.live_stream_notifications ?? true,
            scheduled_stream_notifications: data.scheduled_stream_notifications ?? true,
            followed_streamers_only: data.followed_streamers_only ?? true,
            stream_reminder_minutes: data.stream_reminder_minutes ?? 10,
            max_notifications_per_day: data.max_notifications_per_day ?? 5
          });
        }
      } catch (error) {
        console.error('Error loading notification preferences:', error);
        toast.error('Failed to load your notification settings');
      }
    };
    
    loadPreferences();
  }, [user]);
  
  const savePreferences = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_notification_preferences')
        .upsert({
          user_id: user.id,
          stream_notifications_enabled: preferences.stream_notifications_enabled,
          live_stream_notifications: preferences.live_stream_notifications,
          scheduled_stream_notifications: preferences.scheduled_stream_notifications,
          followed_streamers_only: preferences.followed_streamers_only,
          stream_reminder_minutes: preferences.stream_reminder_minutes,
          max_notifications_per_day: preferences.max_notifications_per_day,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
        
      if (error) throw error;
      
      toast.success('Notification settings saved');
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      toast.error('Failed to save your notification settings');
    } finally {
      setLoading(false);
    }
  };
  
  const handlePermissionRequest = async () => {
    if (!('Notification' in window)) {
      toast.error('Your browser does not support notifications');
      return;
    }
    
    try {
      const permission = await Notification.requestPermission();
      setPermissionGranted(permission === 'granted');
      
      if (permission === 'granted') {
        toast.success('Notification permission granted');
      } else {
        toast.error('Notification permission denied');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Failed to request notification permission');
    }
  };
  
  if (permissionGranted === null) {
    return <div>Checking notification settings...</div>;
  }
  
  if (permissionGranted === false) {
    return (
      <NotificationSoftPrompt 
        title="Enable Stream Notifications"
        description="Get notified when your favorite streamers go live!"
        onRequestPermission={handlePermissionRequest}
      />
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Stream Notification Settings
        </CardTitle>
        <CardDescription>
          Configure how you want to receive notifications about streams
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="stream-notifications">Stream Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Receive notifications about streams
            </p>
          </div>
          <Switch
            id="stream-notifications"
            checked={preferences.stream_notifications_enabled}
            onCheckedChange={(checked) => setPreferences({ 
              ...preferences, 
              stream_notifications_enabled: checked
            })}
          />
        </div>
        
        <Separator />
        
        {preferences.stream_notifications_enabled && (
          <>
            <div className="space-y-4">
              <h3 className="font-medium">Notification Types</h3>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex items-center gap-2">
                  <Bell className="h-4 w-4 text-red-500" />
                  <div>
                    <Label htmlFor="live-stream-notifications">Live Stream Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when streamers go live
                    </p>
                  </div>
                </div>
                <Switch
                  id="live-stream-notifications"
                  checked={preferences.live_stream_notifications}
                  onCheckedChange={(checked) => setPreferences({ 
                    ...preferences, 
                    live_stream_notifications: checked
                  })}
                  disabled={!preferences.stream_notifications_enabled}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <div>
                    <Label htmlFor="scheduled-stream-notifications">Scheduled Stream Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about upcoming scheduled streams
                    </p>
                  </div>
                </div>
                <Switch
                  id="scheduled-stream-notifications"
                  checked={preferences.scheduled_stream_notifications}
                  onCheckedChange={(checked) => setPreferences({ 
                    ...preferences, 
                    scheduled_stream_notifications: checked
                  })}
                  disabled={!preferences.stream_notifications_enabled}
                />
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h3 className="font-medium">Filter Settings</h3>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex items-center gap-2">
                  <User className="h-4 w-4 text-green-500" />
                  <div>
                    <Label htmlFor="followed-streamers-only">Only From Followed Streamers</Label>
                    <p className="text-sm text-muted-foreground">
                      Only get notifications from streamers you follow
                    </p>
                  </div>
                </div>
                <Switch
                  id="followed-streamers-only"
                  checked={preferences.followed_streamers_only}
                  onCheckedChange={(checked) => setPreferences({ 
                    ...preferences, 
                    followed_streamers_only: checked
                  })}
                  disabled={!preferences.stream_notifications_enabled}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reminder-time">Stream Reminder Time</Label>
                <Select
                  value={preferences.stream_reminder_minutes.toString()}
                  onValueChange={(value) => setPreferences({
                    ...preferences,
                    stream_reminder_minutes: parseInt(value)
                  })}
                  disabled={!preferences.stream_notifications_enabled || !preferences.scheduled_stream_notifications}
                >
                  <SelectTrigger id="reminder-time" className="w-full">
                    <SelectValue placeholder="Select reminder time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 minutes before</SelectItem>
                    <SelectItem value="10">10 minutes before</SelectItem>
                    <SelectItem value="15">15 minutes before</SelectItem>
                    <SelectItem value="30">30 minutes before</SelectItem>
                    <SelectItem value="60">1 hour before</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  How far in advance to send reminders for scheduled streams
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="max-notifications">Maximum Notifications Per Day</Label>
                <Select
                  value={preferences.max_notifications_per_day.toString()}
                  onValueChange={(value) => setPreferences({
                    ...preferences,
                    max_notifications_per_day: parseInt(value)
                  })}
                  disabled={!preferences.stream_notifications_enabled}
                >
                  <SelectTrigger id="max-notifications" className="w-full">
                    <SelectValue placeholder="Select max notifications" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 notifications</SelectItem>
                    <SelectItem value="5">5 notifications</SelectItem>
                    <SelectItem value="10">10 notifications</SelectItem>
                    <SelectItem value="25">25 notifications</SelectItem>
                    <SelectItem value="50">50 notifications</SelectItem>
                    <SelectItem value="100">Unlimited</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Limit how many stream notifications you receive each day
                </p>
              </div>
            </div>
          </>
        )}
        
        <div className="pt-4">
          <Button 
            onClick={savePreferences} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default StreamNotificationSettings;
