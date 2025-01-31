import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export default function TwitchCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // The OAuth callback handling is now in TwitchIntegration component
    // This is just a loading screen that will be shown briefly
    const returnPath = localStorage.getItem('twitch_auth_return_path') || '/';
    if (!window.location.search.includes('code=')) {
      navigate(returnPath);
    }
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin mb-4" />
      <p className="text-muted-foreground">Connecting your Twitch account...</p>
    </div>
  );
}