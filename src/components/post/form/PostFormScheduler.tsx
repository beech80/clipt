import React from "react";

interface PostFormSchedulerProps {
  scheduledDate?: Date;
  scheduledTime: string;
  onScheduledDateChange: (date: Date | undefined) => void;
  onScheduledTimeChange: (time: string) => void;
  disabled?: boolean;
}

export default function PostFormScheduler({
  scheduledDate,
  scheduledTime,
  onScheduledDateChange,
  onScheduledTimeChange,
  disabled
}: PostFormSchedulerProps) {
  return (
    <div className="flex flex-col space-y-2">
      <label className="text-sm font-medium">Schedule Post</label>
      <input
        type="date"
        value={scheduledDate ? scheduledDate.toISOString().split("T")[0] : ""}
        onChange={(e) => onScheduledDateChange(e.target.value ? new Date(e.target.value) : undefined)}
        disabled={disabled}
        className="border border-border rounded-lg p-2"
      />
      <input
        type="time"
        value={scheduledTime}
        onChange={(e) => onScheduledTimeChange(e.target.value)}
        disabled={disabled}
        className="border border-border rounded-lg p-2"
      />
    </div>
  );
}
