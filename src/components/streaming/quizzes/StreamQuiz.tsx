import React, { useState, useEffect } from "react";
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
  quizId?: string;
}

interface QuizData {
  title: string;
  questions: QuizQuestion[];
}

interface SupabaseQuizData {
  title: string;
  questions: QuizQuestion[];
}

export const StreamQuiz = ({ streamId, quizId }: StreamQuizProps) => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (quizId) {
      loadQuiz();
    }
  }, [quizId]);

  const loadQuiz = async () => {
    const { data: quiz, error } = await supabase
      .from("stream_quizzes")
      .select("*")
      .eq("id", quizId)
      .single();

    if (error) {
      toast.error("Failed to load quiz");
      return;
    }

    // Cast the JSON questions to the correct type
    const supabaseQuiz = {
      title: quiz.title,
      questions: quiz.questions as QuizQuestion[]
    };

    const quizData: QuizData = {
      title: supabaseQuiz.title,
      questions: supabaseQuiz.questions
    };

    setTitle(quizData.title);
    setQuestions(quizData.questions);
  };

  const handleAnswer = async () => {
    const currentQ = questions[currentQuestion];
    const isCorrect = selectedAnswer === currentQ.correct_answer;

    if (isCorrect) {
      setScore((prev) => prev + 1);
      toast.success("Correct answer!");
    } else {
      toast.error("Wrong answer!");
    }

    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedAnswer("");
    } else {
      setIsCompleted(true);
      submitQuizResults();
    }
  };

  const submitQuizResults = async () => {
    if (!user || !quizId) return;

    const { error } = await supabase.from("quiz_responses").insert({
      quiz_id: quizId,
      user_id: user.id,
      score: score,
      answers: questions.map((_, index) => ({
        question_id: index,
        selected_answer: selectedAnswer,
      })),
    });

    if (error) {
      toast.error("Failed to submit quiz results");
    }
  };

  if (!questions.length) {
    return <div>Loading quiz...</div>;
  }

  if (isCompleted) {
    return (
      <Card className="p-6 text-center">
        <h3 className="text-xl font-semibold mb-4">Quiz Completed!</h3>
        <p className="text-lg mb-2">
          Your score: {score} out of {questions.length}
        </p>
        <p className="text-muted-foreground">
          ({Math.round((score / questions.length) * 100)}%)
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold mb-6">{title}</h3>
      <div className="space-y-6">
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            Question {currentQuestion + 1} of {questions.length}
          </p>
          <p className="text-lg mb-4">{questions[currentQuestion]?.question}</p>
          <RadioGroup
            value={selectedAnswer}
            onValueChange={setSelectedAnswer}
            className="space-y-2"
          >
            {questions[currentQuestion]?.options.map((option, index) => (
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
          {currentQuestion + 1 === questions.length
            ? "Complete Quiz"
            : "Next Question"}
        </Button>
      </div>
    </Card>
  );
};
