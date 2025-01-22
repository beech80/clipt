import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

interface PostFormSchedulerProps {
  scheduledDate: Date | undefined;
  scheduledTime: string;
  onScheduledDateChange: (date: Date | undefined) => void;
  onScheduledTimeChange: (time: string) => void;
}

const PostFormScheduler = ({
  scheduledDate,
  scheduledTime,
  onScheduledDateChange,
  onScheduledTimeChange,
}: PostFormSchedulerProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          type="button" 
          variant="outline"
          className="w-full sm:w-auto"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {scheduledDate ? format(scheduledDate, 'PPP') : 'Schedule'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <div className="space-y-4">
          <Calendar
            mode="single"
            selected={scheduledDate}
            onSelect={onScheduledDateChange}
            disabled={(date) => date < new Date()}
          />
          <div className="flex items-center gap-2">
            <input
              type="time"
              value={scheduledTime}
              onChange={(e) => onScheduledTimeChange(e.target.value)}
              className="px-3 py-2 border rounded-md w-full"
            />
            {(scheduledDate || scheduledTime) && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  onScheduledDateChange(undefined);
                  onScheduledTimeChange("");
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default PostFormScheduler;