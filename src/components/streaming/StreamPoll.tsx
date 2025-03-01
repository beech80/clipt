import { useState, useEffect } from 'react';
import { PieChart, Vote, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface PollData {
  id: string;
  question: string;
  options: PollOption[];
  total_votes: number;
  is_active: boolean;
  created_at: string;
  end_time?: string;
}

interface StreamPollProps {
  streamId: string;
  isStreamer: boolean;
  className?: string;
}

export function StreamPoll({ streamId, isStreamer, className = '' }: StreamPollProps) {
  const { user } = useAuth();
  const [activePoll, setActivePoll] = useState<PollData | null>(null);
  const [isCreatingPoll, setIsCreatingPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userVoted, setUserVoted] = useState(false);

  // Fetch active poll for this stream
  useEffect(() => {
    const fetchActivePoll = async () => {
      try {
        const { data, error } = await supabase
          .from('stream_polls')
          .select('*')
          .eq('stream_id', streamId)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching poll:', error);
          return;
        }

        if (data) {
          setActivePoll(data);
          
          // Check if user has voted
          if (user) {
            const { data: voteData } = await supabase
              .from('stream_poll_votes')
              .select('*')
              .eq('poll_id', data.id)
              .eq('user_id', user.id)
              .limit(1);
              
            setUserVoted(!!voteData && voteData.length > 0);
          }
        }
      } catch (error) {
        console.error('Error in poll fetch:', error);
      }
    };

    fetchActivePoll();

    // Subscribe to poll updates
    const pollSubscription = supabase
      .channel('poll-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'stream_polls',
        filter: `stream_id=eq.${streamId}`,
      }, fetchActivePoll)
      .subscribe();

    // Subscribe to vote updates
    const voteSubscription = supabase
      .channel('poll-vote-updates')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'stream_poll_votes',
        filter: activePoll ? `poll_id=eq.${activePoll.id}` : undefined,
      }, fetchActivePoll)
      .subscribe();

    return () => {
      pollSubscription.unsubscribe();
      voteSubscription.unsubscribe();
    };
  }, [streamId, user, activePoll?.id]);

  const handleCreatePoll = async () => {
    if (!user || !isStreamer) return;
    
    // Validate
    if (!pollQuestion.trim()) {
      toast.error('Please enter a poll question');
      return;
    }
    
    const validOptions = pollOptions.filter(opt => opt.trim() !== '');
    if (validOptions.length < 2) {
      toast.error('Please enter at least 2 options');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // End any existing active polls
      if (activePoll) {
        await supabase
          .from('stream_polls')
          .update({ is_active: false, end_time: new Date().toISOString() })
          .eq('id', activePoll.id);
      }
      
      // Create new poll
      const optionsWithVotes = validOptions.map(text => ({
        id: crypto.randomUUID(),
        text,
        votes: 0
      }));
      
      const { data, error } = await supabase
        .from('stream_polls')
        .insert({
          stream_id: streamId,
          user_id: user.id,
          question: pollQuestion,
          options: optionsWithVotes,
          total_votes: 0,
          is_active: true,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (error) throw error;
      
      setActivePoll(data);
      setIsCreatingPoll(false);
      setPollQuestion('');
      setPollOptions(['', '']);
      toast.success('Poll created successfully!');
    } catch (error) {
      console.error('Error creating poll:', error);
      toast.error('Failed to create poll');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (optionId: string) => {
    if (!user || !activePoll || userVoted) return;
    
    try {
      // Add vote
      const { error: voteError } = await supabase
        .from('stream_poll_votes')
        .insert({
          poll_id: activePoll.id,
          user_id: user.id,
          option_id: optionId,
          created_at: new Date().toISOString()
        });
        
      if (voteError) throw voteError;
      
      // Update poll data
      const updatedOptions = activePoll.options.map(opt => 
        opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
      );
      
      const { error: pollError } = await supabase
        .from('stream_polls')
        .update({ 
          options: updatedOptions,
          total_votes: activePoll.total_votes + 1
        })
        .eq('id', activePoll.id);
        
      if (pollError) throw pollError;
      
      setUserVoted(true);
      toast.success('Vote recorded!');
    } catch (error) {
      console.error('Error voting:', error);
      toast.error('Failed to record vote');
    }
  };

  const handleEndPoll = async () => {
    if (!activePoll || !isStreamer) return;
    
    try {
      await supabase
        .from('stream_polls')
        .update({ 
          is_active: false,
          end_time: new Date().toISOString()
        })
        .eq('id', activePoll.id);
        
      setActivePoll(null);
      toast.success('Poll ended');
    } catch (error) {
      console.error('Error ending poll:', error);
      toast.error('Failed to end poll');
    }
  };

  const addOption = () => {
    if (pollOptions.length < 5) {
      setPollOptions([...pollOptions, '']);
    } else {
      toast.error('Maximum 5 options allowed');
    }
  };

  const removeOption = (index: number) => {
    if (pollOptions.length > 2) {
      const newOptions = [...pollOptions];
      newOptions.splice(index, 1);
      setPollOptions(newOptions);
    } else {
      toast.error('Minimum 2 options required');
    }
  };

  return (
    <div className={`p-4 border rounded-lg shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold flex items-center gap-1">
          <PieChart className="h-4 w-4" />
          Polls
        </h3>
        
        {isStreamer && !activePoll && !isCreatingPoll && (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setIsCreatingPoll(true)}
          >
            Create Poll
          </Button>
        )}
        
        {isStreamer && activePoll && (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleEndPoll}
          >
            End Poll
          </Button>
        )}
      </div>
      
      {isCreatingPoll && (
        <div className="space-y-3">
          <Input
            placeholder="Ask a question..."
            value={pollQuestion}
            onChange={(e) => setPollQuestion(e.target.value)}
          />
          
          <div className="space-y-2">
            {pollOptions.map((option, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...pollOptions];
                    newOptions[index] = e.target.value;
                    setPollOptions(newOptions);
                  }}
                  className="flex-grow"
                />
                {index > 1 && (
                  <Button 
                    size="icon" 
                    variant="ghost"
                    onClick={() => removeOption(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          
          <div className="flex justify-between">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={addOption}
              disabled={pollOptions.length >= 5}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Option
            </Button>
            
            <div className="space-x-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setIsCreatingPoll(false)}
              >
                Cancel
              </Button>
              
              <Button 
                size="sm" 
                onClick={handleCreatePoll}
                disabled={isSubmitting}
              >
                Start Poll
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {activePoll && (
        <div className="space-y-3">
          <h4 className="font-medium">{activePoll.question}</h4>
          
          <div className="space-y-2">
            {activePoll.options.map((option) => {
              const percentage = activePoll.total_votes > 0 
                ? Math.round((option.votes / activePoll.total_votes) * 100) 
                : 0;
                
              return (
                <div key={option.id} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{option.text}</span>
                    <span>{percentage}% ({option.votes} votes)</span>
                  </div>
                  
                  <div className="flex gap-2 items-center">
                    <Progress value={percentage} className="flex-grow h-2" />
                    
                    {!userVoted && user && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleVote(option.id)}
                        className="flex-shrink-0"
                      >
                        <Vote className="h-4 w-4 mr-1" />
                        Vote
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="text-sm text-muted-foreground">
            Total votes: {activePoll.total_votes}
            {userVoted && <span className="ml-2">(You voted)</span>}
          </div>
        </div>
      )}
      
      {!activePoll && !isCreatingPoll && (
        <div className="text-center py-8 text-muted-foreground">
          {isStreamer ? 'Create a poll to engage with your audience' : 'No active polls at the moment'}
        </div>
      )}
    </div>
  );
}

export default StreamPoll;
