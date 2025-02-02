import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface StreamMiniGameProps {
  streamId: string;
  userId: string;
}

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer?: string;
}

interface Quiz {
  id: string;
  title: string;
  questions: Question[];
}

export function StreamMiniGame({ streamId, userId }: StreamMiniGameProps) {
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const fetchActiveQuiz = async () => {
      const { data, error } = await supabase
        .from('stream_quizzes')
        .select('*')
        .eq('stream_id', streamId)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching quiz:', error);
        return;
      }

      if (data) {
        const parsedQuestions = typeof data.questions === 'string' 
          ? JSON.parse(data.questions) 
          : data.questions;

        setActiveQuiz({
          id: data.id,
          title: data.title,
          questions: parsedQuestions
        });
      }
    };

    fetchActiveQuiz();

    const channel = supabase
      .channel(`quiz_updates:${streamId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'stream_quizzes',
        filter: `stream_id=eq.${streamId}`
      }, fetchActiveQuiz)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamId]);

  const submitAnswer = async () => {
    if (!activeQuiz || !selectedAnswer) return;

    try {
      const isCorrect = activeQuiz.questions[currentQuestion].correctAnswer === selectedAnswer;
      if (isCorrect) {
        setScore(prev => prev + 1);
      }

      await supabase.from('quiz_responses').insert({
        quiz_id: activeQuiz.id,
        user_id: userId,
        answers: {
          questionId: activeQuiz.questions[currentQuestion].id,
          selectedAnswer,
          isCorrect
        }
      });

      if (currentQuestion + 1 < activeQuiz.questions.length) {
        setCurrentQuestion(prev => prev + 1);
        setSelectedAnswer('');
      } else {
        setIsCompleted(true);
        toast.success(`Quiz completed! Score: ${score}/${activeQuiz.questions.length}`);
      }
    } catch (error) {
      toast.error('Failed to submit answer');
    }
  };

  if (!activeQuiz) return null;

  if (isCompleted) {
    return (
      <Card className="p-6 text-center">
        <h3 className="text-xl font-semibold mb-4">Quiz Completed!</h3>
        <p className="text-lg mb-2">
          Your score: {score} out of {activeQuiz.questions.length}
        </p>
        <p className="text-muted-foreground">
          ({Math.round((score / activeQuiz.questions.length) * 100)}%)
        </p>
      </Card>
    );
  }

  const currentQ = activeQuiz.questions[currentQuestion];

  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold mb-6">{activeQuiz.title}</h3>
      <div className="space-y-6">
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            Question {currentQuestion + 1} of {activeQuiz.questions.length}
          </p>
          <p className="text-lg mb-4">{currentQ.text}</p>
          <RadioGroup
            value={selectedAnswer}
            onValueChange={setSelectedAnswer}
            className="space-y-2"
          >
            {currentQ.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        <Button
          onClick={submitAnswer}
          disabled={!selectedAnswer}
          className="w-full"
        >
          {currentQuestion + 1 === activeQuiz.questions.length
            ? "Complete Quiz"
            : "Next Question"}
        </Button>
      </div>
    </Card>
  );
}