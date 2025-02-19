
import React from 'react';
import { Card } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface StreamAlertsProps {
  userId: string;
}

export const StreamAlerts = ({ userId }: StreamAlertsProps) => {
  const { data: alerts, refetch } = useQuery({
    queryKey: ['stream-alerts', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stream_alerts')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      return data;
    }
  });

  const updateAlert = async (alertType: string, updates: any) => {
    const { error } = await supabase
      .from('stream_alerts')
      .upsert({
        user_id: userId,
        alert_type: alertType,
        ...updates
      });

    if (error) {
      toast.error('Failed to update alert');
      return;
    }

    toast.success('Alert updated');
    refetch();
  };

  return (
    <Card className="p-6 space-y-6">
      <h3 className="text-xl font-semibold">Stream Alerts</h3>

      <div className="space-y-6">
        {/* Follow Alert */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Follow Alerts</h4>
              <p className="text-sm text-muted-foreground">Show alerts when someone follows</p>
            </div>
            <Switch
              checked={alerts?.some(a => a.alert_type === 'follow')?.enabled ?? true}
              onCheckedChange={(checked) => updateAlert('follow', { enabled: checked })}
            />
          </div>
        </div>

        {/* Gift Alert */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Gift Alerts</h4>
              <p className="text-sm text-muted-foreground">Show alerts for virtual gifts</p>
            </div>
            <Switch
              checked={alerts?.some(a => a.alert_type === 'gift')?.enabled ?? true}
              onCheckedChange={(checked) => updateAlert('gift', { enabled: checked })}
            />
          </div>
        </div>

        {/* Subscription Alert */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Subscription Alerts</h4>
              <p className="text-sm text-muted-foreground">Show alerts for new subscribers</p>
            </div>
            <Switch
              checked={alerts?.some(a => a.alert_type === 'subscription')?.enabled ?? true}
              onCheckedChange={(checked) => updateAlert('subscription', { enabled: checked })}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};
