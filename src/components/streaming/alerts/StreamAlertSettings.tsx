import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { AlertSettings } from './types';
import { AlertSettingsForm } from './AlertSettingsForm';

interface StreamAlertSettingsProps {
  userId: string;
}

export function StreamAlertSettings({ userId }: StreamAlertSettingsProps) {
  const [settings, setSettings] = useState<AlertSettings[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const { data, error } = await supabase
      .from('stream_alerts')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      toast.error('Failed to load alert settings');
      return;
    }

    setSettings(data.map(alert => ({
      ...alert,
      styles: typeof alert.styles === 'string' ? JSON.parse(alert.styles) : alert.styles
    })) || []);
    setLoading(false);
  };

  const updateSettings = async (alertType: string, updates: Partial<AlertSettings>) => {
    const { error } = await supabase
      .from('stream_alerts')
      .update(updates)
      .eq('user_id', userId)
      .eq('alert_type', alertType);

    if (error) {
      toast.error('Failed to update settings');
      return;
    }

    toast.success('Settings updated successfully');
    loadSettings();
  };

  if (loading) {
    return <div>Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Alert Settings</h2>
      
      {settings.map((alert) => (
        <Card key={alert.id} className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold capitalize">{alert.alert_type} Alerts</h3>
              <Switch
                checked={alert.enabled}
                onCheckedChange={(enabled) => 
                  updateSettings(alert.alert_type, { enabled })
                }
              />
            </div>

            <AlertSettingsForm 
              alert={alert}
              onUpdate={updateSettings}
            />
          </div>
        </Card>
      ))}
    </div>
  );
}