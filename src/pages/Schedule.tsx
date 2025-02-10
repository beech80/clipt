
import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { BackButton } from "@/components/ui/back-button";
import { Calendar } from "@/components/ui/calendar";
import GameBoyControls from "@/components/GameBoyControls";
import { Button } from "@/components/ui/button";
import { StreamScheduleForm } from "@/components/streaming/StreamScheduleForm";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Calendar as CalendarIcon, Clock, List, Plus } from "lucide-react";
import { format } from "date-fns";

const Schedule = () => {
  const { user } = useAuth();
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();

  const { data: scheduledStreams, isLoading } = useQuery({
    queryKey: ['scheduled-streams', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('streams')
        .select('*')
        .eq('user_id', user.id)
        .not('scheduled_start_time', 'is', null)
        .order('scheduled_start_time', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Please Login</h2>
          <p className="text-muted-foreground">
            You need to be logged in to access schedule features.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6 pb-40 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton />
          <h1 className="text-2xl font-bold">Stream Schedule</h1>
        </div>
        <Button 
          onClick={() => setShowScheduleForm(true)}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          New Schedule
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Calendar View */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <CalendarIcon className="w-5 h-5 text-purple-500" />
            <h2 className="text-xl font-semibold">Calendar</h2>
          </div>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border"
          />
        </Card>

        {/* Upcoming Streams */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <List className="w-5 h-5 text-purple-500" />
            <h2 className="text-xl font-semibold">Upcoming Streams</h2>
          </div>
          
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
              </div>
            ) : scheduledStreams?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No scheduled streams yet
              </div>
            ) : (
              scheduledStreams?.map((stream) => (
                <Card key={stream.id} className="p-4 hover:bg-accent transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="font-medium">{stream.title || 'Untitled Stream'}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarIcon className="w-4 h-4" />
                        {format(new Date(stream.scheduled_start_time), 'PPP')}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {format(new Date(stream.scheduled_start_time), 'p')}
                        {stream.scheduled_duration && ` - ${stream.scheduled_duration}`}
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Schedule Form Dialog */}
      {showScheduleForm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
          <div className="container flex items-center justify-center min-h-screen">
            <div className="w-full max-w-2xl">
              <StreamScheduleForm 
                streamId={crypto.randomUUID()} 
                onScheduled={() => setShowScheduleForm(false)}
              />
            </div>
          </div>
        </div>
      )}
      
      <GameBoyControls />
    </div>
  );
};

export default Schedule;
