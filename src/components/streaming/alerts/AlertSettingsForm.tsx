import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { AlertSettings } from './types';

interface AlertSettingsFormProps {
  alert: AlertSettings;
  onUpdate: (alertType: string, updates: Partial<AlertSettings>) => Promise<void>;
}

export const AlertSettingsForm = ({ alert, onUpdate }: AlertSettingsFormProps) => {
  return (
    <div className="space-y-4">
      <div>
        <Label>Message Template</Label>
        <Input
          value={alert.message_template}
          onChange={(e) => 
            onUpdate(alert.alert_type, { 
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
            onUpdate(alert.alert_type, {
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
            onUpdate(alert.alert_type, {
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
              onUpdate(alert.alert_type, {
                styles: { ...alert.styles, soundEnabled: enabled }
              })
            }
          />
          <Slider
            disabled={!alert.styles.soundEnabled}
            value={[alert.styles.soundVolume * 100]}
            onValueChange={(value) => 
              onUpdate(alert.alert_type, {
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
              onUpdate(alert.alert_type, {
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
              onUpdate(alert.alert_type, {
                styles: { ...alert.styles, backgroundColor: e.target.value }
              })
            }
          />
        </div>
      </div>
    </div>
  );
};