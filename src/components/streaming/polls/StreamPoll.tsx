import React, { useState, useEffect } from "react";
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

interface StreamPollProps {
  streamId: string;
  pollId?: string;
}

interface PollData {
  question: string;
  options: PollOption[];
}

interface SupabasePollData {
  question: string;
  options: {
    id: string;
    text: string;
    votes: number;
  }[];
}

export const StreamPoll = ({ streamId, pollId }: StreamPollProps) => {
  const { user } = useAuth();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<PollOption[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    if (pollId) {
      loadPoll();
      subscribeToVotes();
    }
  }, [pollId]);

  const loadPoll = async () => {
    const { data: poll, error } = await supabase
      .from("stream_polls")
      .select("*")
      .eq("id", pollId)
      .single();

    if (error) {
      toast.error("Failed to load poll");
      return;
    }

    const supabasePoll = poll as SupabasePollData;
    const pollData: PollData = {
      question: supabasePoll.question,
      options: supabasePoll.options.map(opt => ({
        id: opt.id,
        text: opt.text,
        votes: opt.votes
      }))
    };

    setQuestion(pollData.question);
    setOptions(pollData.options);
    calculateTotalVotes(pollData.options);
  };

  const subscribeToVotes = () => {
    const channel = supabase
      .channel("poll_votes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "poll_responses",
          filter: `poll_id=eq.${pollId}`,
        },
        (payload) => {
          updateVotes(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const calculateTotalVotes = (pollOptions: PollOption[]) => {
    const total = pollOptions.reduce((sum, option) => sum + option.votes, 0);
    setTotalVotes(total);
  };

  const updateVotes = (newVote: any) => {
    setOptions((currentOptions) =>
      currentOptions.map((option) => {
        if (option.id === newVote.selected_options[0]) {
          return { ...option, votes: option.votes + 1 };
        }
        return option;
      })
    );
    setTotalVotes((prev) => prev + 1);
  };

  const handleVote = async (optionId: string) => {
    if (!user || hasVoted) return;

    const { error } = await supabase.from("poll_responses").insert({
      poll_id: pollId,
      user_id: user.id,
      selected_options: [optionId],
    });

    if (error) {
      toast.error("Failed to submit vote");
      return;
    }

    setHasVoted(true);
    toast.success("Vote submitted!");
  };

  return (
    <Card className="p-4 space-y-4">
      <h3 className="text-lg font-semibold">{question}</h3>
      <div className="space-y-2">
        {options.map((option) => (
          <div key={option.id} className="space-y-1">
            <Button
              variant={hasVoted ? "ghost" : "secondary"}
              className="w-full justify-between"
              onClick={() => handleVote(option.id)}
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
      <p className="text-sm text-muted-foreground text-right">
        Total votes: {totalVotes}
      </p>
    </Card>
  );
};