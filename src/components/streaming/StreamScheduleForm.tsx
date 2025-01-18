import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { CalendarIcon, Clock, Repeat } from 'lucide-react';
import { format } from 'date-fns';

interface StreamScheduleFormProps {
  streamId: string;
  onScheduled?: () => void;
}

export const StreamScheduleForm = ({ streamId, onScheduled }: StreamScheduleFormProps) => {
  const { user } = useAuth();
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('60');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringPattern, setRecurringPattern] = useState('weekly');
  const [vodEnabled, setVodEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSchedule = async () => {
    if (!date || !time || !duration) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const scheduledDateTime = new Date(date);
      const [hours, minutes] = time.split(':');
      scheduledDateTime.setHours(parseInt(hours), parseInt(minutes));

      const { error } = await supabase
        .from('streams')
        .update({
          scheduled_start_time: scheduledDateTime.toISOString(),
          scheduled_duration: `${duration} minutes`,
          schedule_status: 'scheduled',
          recurring_schedule: isRecurring ? { pattern: recurringPattern } : null,
          vod_enabled: vodEnabled
        })
        .eq('id', streamId);

      if (error) throw error;

      toast.success('Stream scheduled successfully');
      onScheduled?.();
    } catch (error) {
      console.error('Error scheduling stream:', error);
      toast.error('Failed to schedule stream');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Schedule Stream</h3>
        
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Label>Date</Label>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
              disabled={(date) => date < new Date()}
            />
          </div>

          <div className="flex flex-col space-y-2">
            <Label>Start Time</Label>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          <div className="flex flex-col space-y-2">
            <Label>Duration (minutes)</Label>
            <Input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              min="15"
              max="480"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={isRecurring}
              onCheckedChange={setIsRecurring}
              id="recurring"
            />
            <Label htmlFor="recurring">Recurring Schedule</Label>
          </div>

          {isRecurring && (
            <div className="flex flex-col space-y-2">
              <Label>Repeat Pattern</Label>
              <Select value={recurringPattern} onValueChange={setRecurringPattern}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Bi-weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Switch
              checked={vodEnabled}
              onCheckedChange={setVodEnabled}
              id="vod"
            />
            <Label htmlFor="vod">Enable VOD Recording</Label>
          </div>
        </div>

        <Button 
          onClick={handleSchedule} 
          className="w-full"
          disabled={isLoading}
        >
          Schedule Stream
        </Button>
      </div>
    </Card>
  );
};