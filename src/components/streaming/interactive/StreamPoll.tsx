import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface PollOption {
  id: string;
  text: string;
}

interface StreamPollProps {
  streamId: string;
}

export const StreamPoll = ({ streamId }: StreamPollProps) => {
  const { user } = useAuth();
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  const { data: activePoll } = useQuery({
    queryKey: ['stream-poll', streamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stream_polls')
        .select(`
          *,
          poll_responses (
            selected_options,
            user_id
          )
        `)
        .eq('stream_id', streamId)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data;
    },
    refetchInterval: 5000
  });

  const submitVote = useMutation({
    mutationFn: async (options: string[]) => {
      const { error } = await supabase
        .from('poll_responses')
        .insert({
          poll_id: activePoll?.id,
          user_id: user?.id,
          selected_options: options
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Vote submitted!');
      setSelectedOptions([]);
    },
    onError: () => {
      toast.error('Failed to submit vote');
    }
  });

  if (!activePoll) return null;

  const totalVotes = activePoll.poll_responses?.length || 0;
  const pollOptions = activePoll.options as PollOption[];

  const getOptionPercentage = (optionId: string) => {
    const optionVotes = activePoll.poll_responses?.filter(
      response => {
        const selectedOpts = response.selected_options as string[];
        return selectedOpts.includes(optionId);
      }
    ).length || 0;
    return totalVotes === 0 ? 0 : (optionVotes / totalVotes) * 100;
  };

  const hasVoted = activePoll.poll_responses?.some(
    response => response.user_id === user?.id
  );

  return (
    <Card className="p-4 space-y-4">
      <h3 className="font-semibold text-lg">{activePoll.question}</h3>
      <div className="space-y-2">
        {pollOptions.map((option) => (
          <div key={option.id} className="space-y-1">
            {hasVoted ? (
              <>
                <div className="flex justify-between text-sm">
                  <span>{option.text}</span>
                  <span>{getOptionPercentage(option.id).toFixed(1)}%</span>
                </div>
                <Progress value={getOptionPercentage(option.id)} />
              </>
            ) : (
              <Button
                variant={selectedOptions.includes(option.id) ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => {
                  if (activePoll.allow_multiple_choices) {
                    setSelectedOptions(prev => 
                      prev.includes(option.id)
                        ? prev.filter(id => id !== option.id)
                        : [...prev, option.id]
                    );
                  } else {
                    setSelectedOptions([option.id]);
                  }
                }}
              >
                {option.text}
              </Button>
            )}
          </div>
        ))}
      </div>
      {!hasVoted && selectedOptions.length > 0 && (
        <Button 
          className="w-full"
          onClick={() => submitVote.mutate(selectedOptions)}
          disabled={submitVote.isPending}
        >
          Submit Vote
        </Button>
      )}
      <div className="text-sm text-muted-foreground text-center">
        {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
      </div>
    </Card>
  );
};