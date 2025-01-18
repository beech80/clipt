import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { VerificationRequestForm } from "@/components/verification/VerificationRequestForm";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Shield, ShieldCheck, ShieldX } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const Verification = () => {
  const { user } = useAuth();

  const { data: verificationRequest, isLoading } = useQuery({
    queryKey: ['verificationRequest', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('verification_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user
  });

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Sign in Required</h2>
          <p className="text-muted-foreground">
            Please sign in to request verification.
          </p>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </Card>
      </div>
    );
  }

  const renderStatus = () => {
    if (!verificationRequest) return null;

    const statusConfig = {
      pending: {
        icon: Shield,
        title: "Verification Request Pending",
        description: "Your verification request is being reviewed by our team.",
        className: "text-yellow-500"
      },
      approved: {
        icon: ShieldCheck,
        title: "Account Verified",
        description: "Your account has been verified. Thank you for your patience.",
        className: "text-green-500"
      },
      rejected: {
        icon: ShieldX,
        title: "Verification Request Rejected",
        description: verificationRequest.rejection_reason || "Your verification request was not approved.",
        className: "text-red-500"
      }
    };

    const config = statusConfig[verificationRequest.status as keyof typeof statusConfig];
    const Icon = config.icon;

    return (
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-4">
          <Icon className={`w-8 h-8 ${config.className}`} />
          <div>
            <h3 className="text-lg font-semibold">{config.title}</h3>
            <p className="text-muted-foreground">{config.description}</p>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Account Verification</h1>
      
      {renderStatus()}
      
      {(!verificationRequest || verificationRequest.status === 'rejected') && (
        <VerificationRequestForm />
      )}
    </div>
  );
};

export default Verification;