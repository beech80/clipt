import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, Copy, RefreshCw, EyeOff, Play, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function StreamDashboard() {
  const { user } = useAuth();
  const [stream, setStream] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch or create stream on component mount
  useEffect(() => {
    const fetchOrCreateStream = async () => {
      if (!user) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        console.log("Fetching stream for user:", user.id);
        
        // Try to get existing stream
        const { data: existingStream, error: fetchError } = await supabase
          .from('streams')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error("Error fetching stream:", fetchError);
          throw fetchError;
        }
        
        if (existingStream) {
          console.log("Existing stream found:", existingStream);
          setStream(existingStream);
        } else {
          console.log("No stream found, creating new stream");
          
          // Create new stream with default values
          const { data: newStream, error: createError } = await supabase
            .from('streams')
            .insert({
              user_id: user.id,
              title: `${user.user_metadata?.username || user.email}'s Stream`,
              description: "Welcome to my stream!",
              is_live: false,
              stream_key: await generateRandomKey(),
              rtmp_url: "rtmp://stream.clipt.live/live",
              viewer_count: 0
            })
            .select()
            .single();
          
          if (createError) {
            console.error("Error creating stream:", createError);
            throw createError;
          }
          
          console.log("New stream created:", newStream);
          setStream(newStream);
        }
      } catch (err: any) {
        console.error("Failed to setup stream:", err);
        setError(`Error setting up stream: ${err.message}`);
        toast.error("Failed to set up streaming");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrCreateStream();
  }, [user]);
  
  // Generate a random stream key
  const generateRandomKey = async () => {
    // First try the RPC function
    try {
      const { data, error } = await supabase.rpc('generate_stream_key');
      if (!error && data) {
        return data;
      }
    } catch (err) {
      console.warn("RPC function failed, using client-side fallback");
    }
    
    // Fallback to client-side generation
    const array = new Uint8Array(18);
    window.crypto.getRandomValues(array);
    return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
  };
  
  // Handle copying stream key to clipboard
  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${type} copied to clipboard`);
    } catch (err) {
      console.error("Failed to copy:", err);
      toast.error(`Failed to copy ${type}`);
    }
  };
  
  // Handle stream key regeneration
  const handleRegenerateKey = async () => {
    if (!stream?.id) {
      toast.error("No stream available");
      return;
    }
    
    setIsRegenerating(true);
    
    try {
      const newKey = await generateRandomKey();
      
      // Update the stream with new key
      const { data, error } = await supabase
        .from('streams')
        .update({ stream_key: newKey })
        .eq('id', stream.id)
        .eq('user_id', user?.id)
        .select()
        .single();
      
      if (error) {
        console.error("Error updating stream key:", error);
        throw error;
      }
      
      console.log("Stream key regenerated:", data);
      setStream(data);
      toast.success("Stream key regenerated");
      
    } catch (err: any) {
      console.error("Failed to regenerate stream key:", err);
      toast.error(`Error: ${err.message}`);
    } finally {
      setIsRegenerating(false);
    }
  };
  
  // Handle starting the stream
  const handleStartStream = async () => {
    if (!stream?.id) {
      toast.error("No stream available");
      return;
    }
    
    setIsStarting(true);
    
    try {
      const { data, error } = await supabase
        .from('streams')
        .update({
          is_live: true,
          started_at: new Date().toISOString()
        })
        .eq('id', stream.id)
        .eq('user_id', user?.id)
        .select()
        .single();
      
      if (error) throw error;
      
      console.log("Stream started:", data);
      setStream(data);
      toast.success("Stream is now live!");
    } catch (err: any) {
      console.error("Failed to start stream:", err);
      toast.error(`Error starting stream: ${err.message}`);
    } finally {
      setIsStarting(false);
    }
  };
  
  // Return loading state
  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }
  
  // Return error state
  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }
  
  // Main dashboard content
  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Stream Dashboard</h1>
      
      {/* Stream Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Stream Information</CardTitle>
          <CardDescription>
            Your personal stream details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">RTMP URL</h3>
            <div className="flex items-center gap-2">
              <Input 
                readOnly 
                value={stream?.rtmp_url || 'rtmp://stream.clipt.live/live'} 
                className="bg-black/10 font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(stream?.rtmp_url || 'rtmp://stream.clipt.live/live', 'RTMP URL')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Stream Key</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowKey(!showKey)}
                className="h-8 px-2"
              >
                {showKey ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                {showKey ? 'Hide' : 'Show'}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Input 
                readOnly 
                type={showKey ? 'text' : 'password'} 
                value={stream?.stream_key || ''} 
                className="bg-black/10 font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(stream?.stream_key || '', 'Stream Key')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRegenerateKey} 
              disabled={isRegenerating}
              className="mt-2"
            >
              {isRegenerating && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
              {isRegenerating ? 'Regenerating...' : 'Regenerate Key'}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Warning: Regenerating your stream key will invalidate your current key and disconnect any active streams.
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* OBS Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>OBS Setup</CardTitle>
          <CardDescription>
            Follow these steps to connect OBS to your Clipt stream
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="list-decimal list-inside space-y-2">
            <li>Open OBS Studio on your computer</li>
            <li>Go to Settings &gt; Stream</li>
            <li>Select "Custom..." as the service</li>
            <li>For Server, enter: <span className="font-mono bg-black/10 px-1.5 py-0.5 rounded text-sm">rtmp://stream.clipt.live/live</span></li>
            <li>For Stream Key, copy the key from above and paste it here</li>
            <li>Click Apply and OK</li>
            <li>Back in the main OBS window, click "Start Streaming"</li>
            <li>Return to Clipt and click "Start Stream" below when you're ready to go live</li>
          </ol>
        </CardContent>
      </Card>
      
      {/* Stream Control */}
      <Card>
        <CardHeader>
          <CardTitle>Stream Controls</CardTitle>
          <CardDescription>
            Manage your live stream
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="bg-black/10 p-4 rounded-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{stream?.title || 'Your Stream'}</p>
                  <p className="text-sm text-muted-foreground">{stream?.is_live ? 'Live' : 'Offline'}</p>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span>{stream?.viewer_count || 0}</span>
                </div>
              </div>
            </div>
            
            <Button
              className="w-full bg-red-500 hover:bg-red-600"
              size="lg"
              onClick={handleStartStream}
              disabled={isStarting || stream?.is_live}
            >
              {isStarting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Starting Stream...
                </>
              ) : stream?.is_live ? (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Stream is Live
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Start Stream
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
