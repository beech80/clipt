import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Calendar as CalendarIcon, Clock } from "lucide-react";

interface StreamScheduleFormProps {
  streamId: string;
  onScheduled?: () => void;
}

export const StreamScheduleForm = ({ streamId, onScheduled }: StreamScheduleFormProps) => {
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('60');
  const [isRecurring, setIsRecurring] = useState(false);
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
          recurring_schedule: isRecurring ? { pattern: 'weekly' } : null
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
            <div className="flex items-center space-x-2">
              <CalendarIcon className="w-4 h-4 text-muted-foreground" />
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
                disabled={(date) => date < new Date()}
              />
            </div>
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