import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { useUser } from '@/hooks/useUser';
import { supabase } from '@/supabaseClient';
import { InfoCircledIcon } from '@radix-ui/react-icons';

interface RateLimitSettingsProps {
  className?: string;
}

interface RateLimitSettings {
  maxPerDay: number;
  cooldownMinutes: number;
  combineThreshold: number;
  autoCombine: boolean;
}

const NotificationRateLimitSettings: React.FC<RateLimitSettingsProps> = ({ className }) => {
  const { user } = useUser();
  const [settings, setSettings] = useState<RateLimitSettings>({
    maxPerDay: 20,
    cooldownMinutes: 5,
    combineThreshold: 60,
    autoCombine: true
  });
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load user's current settings
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const { data } = await supabase
          .from('user_preferences')
          .select('notification_rate_limits')
          .eq('user_id', user.id)
          .single();
        
        if (data?.notification_rate_limits) {
          setSettings({
            ...settings,
            ...data.notification_rate_limits
          });
        }
      } catch (error) {
        console.error('Error loading notification rate limit settings:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadSettings();
    }
  }, [user]);

  // Save settings to database
  const saveSettings = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          notification_rate_limits: settings
        }, { onConflict: 'user_id' });
      
      if (error) throw error;
      
      toast.success('Notification settings saved');
    } catch (error) {
      console.error('Error saving notification rate limit settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Notification Rate Limits</CardTitle>
        <CardDescription>
          Control how frequently you receive notifications to avoid overload
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="max-per-day" className="text-base">Maximum notifications per day</Label>
            <span className="text-sm font-medium">{settings.maxPerDay}</span>
          </div>
          <Slider
            id="max-per-day"
            min={5}
            max={100}
            step={5}
            value={[settings.maxPerDay]}
            onValueChange={(value) => setSettings({ ...settings, maxPerDay: value[0] })}
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground">
            Limit the total number of notifications you receive each day
          </p>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="cooldown" className="text-base">Minimum time between notifications</Label>
            <span className="text-sm font-medium">{settings.cooldownMinutes} minutes</span>
          </div>
          <Slider
            id="cooldown"
            min={1}
            max={60}
            step={1}
            value={[settings.cooldownMinutes]}
            onValueChange={(value) => setSettings({ ...settings, cooldownMinutes: value[0] })}
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground">
            Add a cooldown period between notifications to avoid constant interruptions
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-combine" className="text-base mb-1 block">Automatically combine similar notifications</Label>
              <p className="text-xs text-muted-foreground">
                Group multiple similar notifications into a single one to reduce clutter
              </p>
            </div>
            <Switch
              id="auto-combine"
              checked={settings.autoCombine}
              onCheckedChange={(checked) => setSettings({ ...settings, autoCombine: checked })}
              disabled={loading}
            />
          </div>
          
          {settings.autoCombine && (
            <div className="space-y-2 pl-4 border-l-2 border-muted">
              <div className="flex items-center justify-between">
                <Label htmlFor="combine-threshold" className="text-base">Combine within timeframe</Label>
                <span className="text-sm font-medium">{settings.combineThreshold} seconds</span>
              </div>
              <Slider
                id="combine-threshold"
                min={10}
                max={300}
                step={10}
                value={[settings.combineThreshold]}
                onValueChange={(value) => setSettings({ ...settings, combineThreshold: value[0] })}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Combine notifications that arrive within this many seconds of each other
              </p>
            </div>
          )}
        </div>
        
        <div className="bg-muted p-3 rounded-md flex items-start space-x-3">
          <InfoCircledIcon className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            These settings help prevent notification fatigue. When rate limits are reached,
            lower-priority notifications may be delayed or combined into digests.
            Emergency and direct message notifications are always delivered immediately.
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={saveSettings} disabled={loading || isSaving} className="w-full">
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default NotificationRateLimitSettings;
