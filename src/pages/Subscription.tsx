import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, CreditCard, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

  const { data: plans, isLoading: plansLoading } = useQuery({
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

  const handleManageSubscription = async (action: 'cancel' | 'upgrade', planId?: string) => {
    if (!user) {
      toast.error("Please login to manage subscriptions");
      navigate("/login");
      return;
    }

    try {
      if (action === 'cancel') {
        const { error } = await supabase
          .from('user_subscriptions')
          .update({ 
            cancel_at_period_end: true,
            status: 'canceling'
          })
          .eq('user_id', user.id);

        if (error) throw error;
        toast.success("Subscription will be cancelled at the end of the billing period");
      } else if (action === 'upgrade' && planId) {
        // For now, just update the subscription plan
        const { error } = await supabase
          .from('user_subscriptions')
          .update({ 
            plan_id: planId,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (error) throw error;
        toast.success("Subscription updated successfully");
      }
    } catch (error) {
      console.error('Subscription management error:', error);
      toast.error("Failed to manage subscription");
    }
  };

  if (plansLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid md:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-96 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Choose Your Plan</h1>
        
        <div className="grid md:grid-cols-3 gap-8">
          {plans?.map((plan) => (
            <Card key={plan.id} className="p-6 flex flex-col relative">
              {currentSubscription?.plan_id === plan.id && (
                <div className="absolute -top-3 -right-3 bg-green-500 text-white px-3 py-1 rounded-full text-sm">
                  Current Plan
                </div>
              )}
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

              {currentSubscription ? (
                currentSubscription.plan_id === plan.id ? (
                  <Button 
                    onClick={() => handleManageSubscription('cancel')}
                    variant="destructive"
                    className="w-full"
                  >
                    Cancel Subscription
                  </Button>
                ) : (
                  <Button 
                    onClick={() => handleManageSubscription('upgrade', plan.id)}
                    className="w-full"
                    disabled={currentSubscription.cancel_at_period_end}
                  >
                    {plan.price > (currentSubscription.subscription_plans?.price || 0) ? 'Upgrade' : 'Downgrade'} to {plan.name}
                  </Button>
                )
              ) : (
                <Button 
                  onClick={() => navigate("/login")}
                  className="w-full"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Subscribe
                </Button>
              )}
            </Card>
          ))}
        </div>

        {currentSubscription?.cancel_at_period_end && (
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            <p className="text-sm text-yellow-700">
              Your subscription will be cancelled at the end of the current billing period 
              ({new Date(currentSubscription.current_period_end).toLocaleDateString()})
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Subscription;