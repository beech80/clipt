import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
}

interface StreamQuizProps {
  streamId: string;
}

export const StreamQuiz = ({ streamId }: StreamQuizProps) => {
  const { user } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [quiz, setQuiz] = useState<{
    id: string;
    title: string;
    questions: QuizQuestion[];
  } | null>(null);

  React.useEffect(() => {
    loadActiveQuiz();
  }, [streamId]);

  const loadActiveQuiz = async () => {
    const { data, error } = await supabase
      .from('stream_quizzes')
      .select('*')
      .eq('stream_id', streamId)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error loading quiz:', error);
      return;
    }

    if (data) {
      setQuiz(data);
    }
  };

  const handleAnswer = async () => {
    if (!quiz || !user) return;

    const currentQ = quiz.questions[currentQuestion];
    const isCorrect = selectedAnswer === currentQ.correct_answer;

    if (isCorrect) {
      setScore((prev) => prev + 1);
      toast.success("Correct answer!");
    } else {
      toast.error("Wrong answer!");
    }

    if (currentQuestion + 1 < quiz.questions.length) {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer("");
    } else {
      setIsCompleted(true);
      submitQuizResults();
    }
  };

  const submitQuizResults = async () => {
    if (!quiz || !user) return;

    try {
      const { error } = await supabase.from('quiz_responses').insert({
        quiz_id: quiz.id,
        user_id: user.id,
        score: score,
        answers: quiz.questions.map((_, index) => ({
          question_id: index,
          selected_answer: selectedAnswer,
        })),
      });

      if (error) throw error;
      toast.success("Quiz completed successfully!");
    } catch (error) {
      console.error('Error submitting quiz results:', error);
      toast.error("Failed to submit quiz results");
    }
  };

  if (!quiz) return null;

  if (isCompleted) {
    return (
      <Card className="p-6 text-center">
        <h3 className="text-xl font-semibold mb-4">Quiz Completed!</h3>
        <p className="text-lg mb-2">
          Your score: {score} out of {quiz.questions.length}
        </p>
        <p className="text-muted-foreground">
          ({Math.round((score / quiz.questions.length) * 100)}%)
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold mb-6">{quiz.title}</h3>
      <div className="space-y-6">
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            Question {currentQuestion + 1} of {quiz.questions.length}
          </p>
          <p className="text-lg mb-4">{quiz.questions[currentQuestion]?.question}</p>
          <RadioGroup
            value={selectedAnswer}
            onValueChange={setSelectedAnswer}
            className="space-y-2"
          >
            {quiz.questions[currentQuestion]?.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        <Button
          onClick={handleAnswer}
          disabled={!selectedAnswer}
          className="w-full"
        >
          {currentQuestion + 1 === quiz.questions.length
            ? "Complete Quiz"
            : "Next Question"}
        </Button>
      </div>
    </Card>
  );
};