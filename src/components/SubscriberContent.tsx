import { ReactNode } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SubscriberContentProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const SubscriberContent = ({ children, fallback }: SubscriberContentProps) => {
  const { isSubscribed, isLoading } = useSubscription();
  const navigate = useNavigate();

  if (isLoading) {
    return <div className="animate-pulse h-32 bg-gray-200 rounded"></div>;
  }

  if (!isSubscribed) {
    return fallback || (
      <Card className="p-6 text-center">
        <Lock className="h-8 w-8 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold mb-2">Subscriber-Only Content</h3>
        <p className="text-gray-600 mb-4">
          Subscribe to access this exclusive content
        </p>
        <Button onClick={() => navigate("/subscription")}>
          View Plans
        </Button>
      </Card>
    );
  }

  return <>{children}</>;
};