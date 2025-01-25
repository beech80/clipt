import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface AlertSettings {
  id: string;
  alert_type: string;
  enabled: boolean;
  styles: {
    animation: string;
    duration: number;
    soundEnabled: boolean;
    soundVolume: number;
    fontSize: string;
    textColor: string;
    backgroundColor: string;
  };
  message_template: string;
}

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

    setSettings(data || []);
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

            <div className="space-y-4">
              <div>
                <Label>Message Template</Label>
                <Input
                  value={alert.message_template}
                  onChange={(e) => 
                    updateSettings(alert.alert_type, { 
                      message_template: e.target.value 
                    })
                  }
                />
              </div>

              <div>
                <Label>Animation Style</Label>
                <select
                  className="w-full p-2 border rounded"
                  value={alert.styles.animation}
                  onChange={(e) => 
                    updateSettings(alert.alert_type, {
                      styles: { ...alert.styles, animation: e.target.value }
                    })
                  }
                >
                  <option value="fade">Fade</option>
                  <option value="scale">Scale</option>
                  <option value="slide">Slide</option>
                </select>
              </div>

              <div>
                <Label>Duration (ms)</Label>
                <Input
                  type="number"
                  value={alert.styles.duration}
                  onChange={(e) => 
                    updateSettings(alert.alert_type, {
                      styles: { ...alert.styles, duration: parseInt(e.target.value) }
                    })
                  }
                />
              </div>

              <div>
                <Label>Sound Volume</Label>
                <div className="flex items-center space-x-4">
                  <Switch
                    checked={alert.styles.soundEnabled}
                    onCheckedChange={(enabled) => 
                      updateSettings(alert.alert_type, {
                        styles: { ...alert.styles, soundEnabled: enabled }
                      })
                    }
                  />
                  <Slider
                    disabled={!alert.styles.soundEnabled}
                    value={[alert.styles.soundVolume * 100]}
                    onValueChange={(value) => 
                      updateSettings(alert.alert_type, {
                        styles: { ...alert.styles, soundVolume: value[0] / 100 }
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Text Color</Label>
                  <Input
                    type="color"
                    value={alert.styles.textColor}
                    onChange={(e) => 
                      updateSettings(alert.alert_type, {
                        styles: { ...alert.styles, textColor: e.target.value }
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Background Color</Label>
                  <Input
                    type="color"
                    value={alert.styles.backgroundColor}
                    onChange={(e) => 
                      updateSettings(alert.alert_type, {
                        styles: { ...alert.styles, backgroundColor: e.target.value }
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}