import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, CreditCard } from "lucide-react";
import { toast } from "sonner";

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  is_active: boolean;
}

const Subscription = () => {
  const { user } = useAuth();

  const { data: plans, isLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price');
      
      if (error) throw error;
      return data as SubscriptionPlan[];
    }
  });

  const { data: currentSubscription } = useQuery({
    queryKey: ['user-subscription', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*, subscription_plans(*)')
        .eq('user_id', user?.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user
  });

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      toast.error("Please login to subscribe");
      return;
    }

    try {
      // Here we'll integrate Stripe payment later
      toast.info("Payment integration coming soon!");
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error("Failed to process subscription");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Choose Your Plan</h1>
        
        <div className="grid md:grid-cols-3 gap-8">
          {plans?.map((plan) => (
            <Card key={plan.id} className="p-6 flex flex-col">
              <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
              <p className="text-3xl font-bold mb-4">
                ${plan.price.toFixed(2)}
                <span className="text-sm font-normal text-gray-600">/month</span>
              </p>
              <p className="text-gray-600 mb-6">{plan.description}</p>
              
              <ul className="space-y-3 mb-8 flex-grow">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                onClick={() => handleSubscribe(plan.id)}
                className="w-full"
                disabled={currentSubscription?.plan_id === plan.id}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                {currentSubscription?.plan_id === plan.id ? 'Current Plan' : 'Subscribe'}
              </Button>
            </Card>
          ))}
        </div>

        {currentSubscription && (
          <div className="mt-8 text-center text-sm text-gray-600">
            You are currently subscribed to the {currentSubscription.subscription_plans.name} plan.
            {currentSubscription.cancel_at_period_end && 
              " Your subscription will end at the end of the current period."}
          </div>
        )}
      </div>
    </div>
  );
};

export default Subscription;