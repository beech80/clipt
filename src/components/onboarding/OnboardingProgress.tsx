import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface OnboardingStep {
  step_name: string;
  completed: boolean;
  completed_at: string | null;
}

export function OnboardingProgress() {
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [progress, setProgress] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchOnboardingProgress();
    }
  }, [user]);

  const fetchOnboardingProgress = async () => {
    try {
      const { data, error } = await supabase
        .from('onboarding_progress')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data) {
        setSteps(data);
        const completedSteps = data.filter(step => step.completed).length;
        setProgress((completedSteps / data.length) * 100);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch onboarding progress",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Onboarding Progress</h3>
        <span className="text-sm text-muted-foreground">
          {Math.round(progress)}% Complete
        </span>
      </div>
      <Progress value={progress} className="w-full" />
      <div className="space-y-2">
        {steps.map((step) => (
          <div
            key={step.step_name}
            className="flex items-center justify-between"
          >
            <span className="text-sm">{step.step_name}</span>
            {step.completed ? (
              <span className="text-sm text-green-500">Completed</span>
            ) : (
              <span className="text-sm text-muted-foreground">Pending</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}