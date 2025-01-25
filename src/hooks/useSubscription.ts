import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

export const useSubscription = () => {
  const { user } = useAuth();

  const { data: subscription, isLoading } = useQuery({
    queryKey: ['user-subscription', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans (
            id,
            name,
            price,
            features
          )
        `)
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user
  });

  const isSubscribed = !!subscription && 
    subscription.status === 'active' && 
    new Date(subscription.current_period_end) > new Date();

  return {
    subscription,
    isLoading,
    isSubscribed,
    plan: subscription?.subscription_plans
  };
};