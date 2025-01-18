import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useOnboarding = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCompleted, setIsCompleted] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('welcome');

  useEffect(() => {
    if (user) {
      checkOnboardingStatus();
    }
  }, [user]);

  const checkOnboardingStatus = async () => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user?.id)
        .single();

      if (profileData?.onboarding_completed) {
        setIsCompleted(true);
        return;
      }

      const { data: steps } = await supabase
        .from('onboarding_progress')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: true });

      if (steps && steps.length > 0) {
        const lastIncompleteStep = steps.find(step => !step.completed);
        if (lastIncompleteStep) {
          setCurrentStep(lastIncompleteStep.step_name);
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check onboarding status",
        variant: "destructive",
      });
    }
  };

  const completeStep = async (stepName: string) => {
    try {
      const { error } = await supabase
        .from('onboarding_progress')
        .upsert({
          user_id: user?.id,
          step_name: stepName,
          completed: true,
          completed_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Completed step: ${stepName}`,
      });

      await checkOnboardingStatus();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update step progress",
        variant: "destructive",
      });
    }
  };

  return {
    isCompleted,
    currentStep,
    completeStep,
    checkOnboardingStatus,
  };
};