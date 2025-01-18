import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { StreamScheduleForm } from "@/components/streaming/StreamScheduleForm";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

const Schedule = () => {
  const { user } = useAuth();

  const { data: stream, isLoading } = useQuery({
    queryKey: ['stream', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('streams')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Sign in Required</h2>
          <p className="text-muted-foreground">
            Please sign in to manage your stream schedule.
          </p>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </Card>
      </div>
    );
  }

  const renderUpcomingStream = () => {
    if (!stream?.scheduled_start_time) return null;

    const scheduledDate = new Date(stream.scheduled_start_time);
    const duration = typeof stream.scheduled_duration === 'string' 
      ? stream.scheduled_duration
      : stream.scheduled_duration 
        ? `${stream.scheduled_duration.minutes || 0} minutes`
        : null;
    
    return (
      <Card className="p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Upcoming Stream</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span>{format(scheduledDate, 'MMMM d, yyyy')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span>{format(scheduledDate, 'h:mm a')}</span>
          </div>
          {duration && (
            <div className="text-sm text-muted-foreground">
              Duration: {duration}
            </div>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Stream Schedule</h1>
      
      {renderUpcomingStream()}
      
      {stream?.id && (
        <StreamScheduleForm 
          streamId={stream.id}
          onScheduled={() => {
            // Refetch stream data after scheduling
            window.location.reload();
          }}
        />
      )}
    </div>
  );
};

export default Schedule;