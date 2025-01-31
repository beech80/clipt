import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { MessageSquare } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const DiscordConnect = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleConnect = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: `${window.location.origin}/auth/discord/callback`,
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error('Discord connection error:', error);
      toast.error('Failed to connect Discord');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleConnect}
      disabled={loading}
      className="w-full"
      variant="outline"
    >
      <MessageSquare className="w-4 h-4 mr-2" />
      {loading ? "Connecting..." : "Connect Discord"}
    </Button>
  );
};

export default DiscordConnect;