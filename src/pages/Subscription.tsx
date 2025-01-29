import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const Subscription = () => {
  const { toast } = useToast();

  const { data: plans, isLoading } = useQuery({
    queryKey: ['subscriptionPlans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  const handleSubscribe = async (planId: string) => {
    try {
      // This is a placeholder - you'll need to implement the actual subscription logic
      toast({
        title: "Coming Soon",
        description: "Subscription functionality will be available soon!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process subscription. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <Card className="p-8">
          <div className="text-center">Loading subscription plans...</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Subscription Plans</h1>

      <div className="grid gap-6 md:grid-cols-3">
        {plans?.map((plan) => (
          <Card key={plan.id} className="p-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">{plan.name}</h2>
              <p className="text-3xl font-bold">
                ${plan.price}<span className="text-sm font-normal">/month</span>
              </p>
              <p className="text-muted-foreground">{plan.description}</p>
              
              <div className="space-y-2">
                {(plan.features as string[])?.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <Button 
                className="w-full" 
                onClick={() => handleSubscribe(plan.id)}
              >
                Subscribe
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Subscription Benefits</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">Ad-Free Experience</h3>
            <p className="text-muted-foreground">
              Enjoy an uninterrupted viewing experience without any advertisements.
            </p>
          </div>
          <div>
            <h3 className="font-medium">Exclusive Content</h3>
            <p className="text-muted-foreground">
              Access subscriber-only streams and content from your favorite creators.
            </p>
          </div>
          <div>
            <h3 className="font-medium">Enhanced Features</h3>
            <p className="text-muted-foreground">
              Get access to advanced streaming features and customization options.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Subscription;