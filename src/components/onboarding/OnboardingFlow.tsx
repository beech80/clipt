import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronRight, UserCircle, Settings, Gamepad } from "lucide-react";

const ONBOARDING_STEPS = [
  {
    id: "welcome",
    title: "Welcome to the Platform!",
    description: "Let's get you set up with your new account.",
    icon: UserCircle,
  },
  {
    id: "preferences",
    title: "Set Your Preferences",
    description: "Customize your experience on the platform.",
    icon: Settings,
  },
  {
    id: "interests",
    title: "Choose Your Interests",
    description: "Tell us what kind of content you're interested in.",
    icon: Gamepad,
  },
];

export function OnboardingFlow() {
  const [currentStep, setCurrentStep] = React.useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleStepComplete = async () => {
    try {
      const stepName = ONBOARDING_STEPS[currentStep].id;
      
      await supabase
        .from('onboarding_steps')
        .upsert({
          user_id: user?.id,
          step_name: stepName,
          completed: true,
          completed_at: new Date().toISOString(),
        });

      if (currentStep < ONBOARDING_STEPS.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        // Update profile to mark onboarding as completed
        await supabase
          .from('profiles')
          .update({ onboarding_completed: true })
          .eq('id', user?.id);

        toast({
          title: "Welcome aboard!",
          description: "Your account is now fully set up.",
        });
        
        navigate('/');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save onboarding progress.",
        variant: "destructive",
      });
    }
  };

  const CurrentStepIcon = ONBOARDING_STEPS[currentStep].icon;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-4">
            <CurrentStepIcon className="w-8 h-8 text-primary" />
            <CardTitle>{ONBOARDING_STEPS[currentStep].title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {ONBOARDING_STEPS[currentStep].description}
          </p>
          <div className="mt-6 flex justify-center">
            <div className="flex gap-2">
              {ONBOARDING_STEPS.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === currentStep
                      ? "bg-primary"
                      : index < currentStep
                      ? "bg-primary/50"
                      : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
          >
            Skip for now
          </Button>
          <Button
            onClick={handleStepComplete}
            className="gap-2"
          >
            {currentStep === ONBOARDING_STEPS.length - 1 ? "Complete" : "Next"}
            <ChevronRight className="w-4 h-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}