import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface Poll {
  id: string;
  question: string;
  options: PollOption[];
}

interface StreamPollProps {
  streamId: string;
}

export const StreamPoll = ({ streamId }: StreamPollProps) => {
  const { user } = useAuth();
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [totalVotes, setTotalVotes] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [poll, setPoll] = useState<Poll | null>(null);

  React.useEffect(() => {
    loadActivePoll();
    subscribeToPollUpdates();
  }, [streamId]);

  const loadActivePoll = async () => {
    const { data, error } = await supabase
      .from('stream_polls')
      .select('*')
      .eq('stream_id', streamId)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error loading poll:', error);
      return;
    }

    if (data) {
      const formattedPoll: Poll = {
        id: data.id,
        question: data.question,
        options: (data.options as any[]).map(option => ({
          id: option.id,
          text: option.text,
          votes: option.votes || 0
        }))
      };
      setPoll(formattedPoll);
      calculateTotalVotes(formattedPoll.options);
    }
  };

  const subscribeToPollUpdates = () => {
    const channel = supabase
      .channel('poll_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stream_polls',
          filter: `stream_id=eq.${streamId}`,
        },
        (payload) => {
          if (payload.new) {
            const updatedPoll: Poll = {
              id: payload.new.id,
              question: payload.new.question,
              options: (payload.new.options as any[]).map(option => ({
                id: option.id,
                text: option.text,
                votes: option.votes || 0
              }))
            };
            setPoll(updatedPoll);
            calculateTotalVotes(updatedPoll.options);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const calculateTotalVotes = (options: PollOption[]) => {
    const total = options.reduce((sum, option) => sum + option.votes, 0);
    setTotalVotes(total);
  };

  const handleVote = async () => {
    if (!user || !selectedOption || hasVoted || !poll) return;

    try {
      const { error } = await supabase.from('poll_responses').insert({
        poll_id: poll.id,
        user_id: user.id,
        selected_options: [selectedOption],
      });

      if (error) throw error;

      setHasVoted(true);
      toast.success('Vote submitted successfully!');
      
      // Update local state
      const updatedOptions = poll.options.map(option => 
        option.id === selectedOption 
          ? { ...option, votes: option.votes + 1 }
          : option
      );
      setPoll({ ...poll, options: updatedOptions });
      calculateTotalVotes(updatedOptions);
    } catch (error) {
      console.error('Error submitting vote:', error);
      toast.error('Failed to submit vote');
    }
  };

  if (!poll) return null;

  return (
    <Card className="p-4 space-y-4">
      <h3 className="font-semibold">{poll.question}</h3>
      <div className="space-y-2">
        {poll.options.map((option) => (
          <div key={option.id} className="space-y-1">
            <Button
              variant={hasVoted ? "ghost" : "secondary"}
              className="w-full justify-between"
              onClick={() => setSelectedOption(option.id)}
              disabled={hasVoted}
            >
              <span>{option.text}</span>
              {hasVoted && (
                <span className="text-sm text-muted-foreground">
                  {totalVotes > 0
                    ? Math.round((option.votes / totalVotes) * 100)
                    : 0}
                  %
                </span>
              )}
            </Button>
            {hasVoted && (
              <Progress
                value={(option.votes / totalVotes) * 100}
                className="h-2"
              />
            )}
          </div>
        ))}
      </div>
      {!hasVoted && (
        <Button
          onClick={handleVote}
          disabled={!selectedOption}
          className="w-full"
        >
          Submit Vote
        </Button>
      )}
      <p className="text-sm text-muted-foreground text-right">
        Total votes: {totalVotes}
      </p>
    </Card>
  );
};