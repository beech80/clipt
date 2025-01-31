import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Discord } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const DISCORD_CLIENT_ID = import.meta.env.VITE_DISCORD_CLIENT_ID;
const REDIRECT_URI = 'http://localhost:5173/auth/discord/callback';

export function DiscordConnect() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    if (!user) {
      toast.error("Please login first");
      return;
    }

    const scope = 'identify email guilds';
    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(scope)}`;
    
    window.location.href = authUrl;
  };

  return (
    <Button 
      onClick={handleConnect} 
      disabled={loading}
      className="w-full"
      variant="outline"
    >
      <Discord className="w-4 h-4 mr-2" />
      {loading ? "Connecting..." : "Connect Discord"}
    </Button>
  );
}