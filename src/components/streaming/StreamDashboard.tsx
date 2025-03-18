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
import { StreamerDashboardChat } from "./chat/StreamerDashboardChat";
import { streamingConfig, generateRtmpUrl } from "@/config/streamingConfig";
import { emergencyCreateStream } from '@/lib/emergency-stream-fix';

export function StreamDashboard() {
  const { user } = useAuth();
  const [stream, setStream] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use config values instead of hardcoded values
  const RTMP_URL = streamingConfig.RTMP_URL;
  // Define the streaming server URL for viewers to watch
  const STREAM_SERVER_URL = streamingConfig.STREAM_SERVER_URL;

  // Fetch or create stream on component mount
  useEffect(() => {
    if (!user) return;

    const fetchOrCreateStream = async () => {
      setIsLoading(true);
      setError(null);

      try {
        console.log("Using bare minimum stream creation approach");
        
        // Using only the emergency method that should work regardless of schema issues
        const { success, stream, error: emergencyError } = await emergencyCreateStream(
          user.id,
          `${user.user_metadata?.username || user.email}'s Stream`
        );
        
        if (success && stream) {
          console.log("Stream created/fetched successfully:", stream);
          setStream(stream);
          return;
        }
        
        // If emergency method failed (should never happen), show error
        console.error("Emergency stream creation failed:", emergencyError);
        setError(`Could not create streaming profile: ${emergencyError?.message || "Unknown error"}`);
        toast.error("Could not create streaming profile");
      } catch (err: any) {
        console.error("Unhandled error in stream creation:", err);
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
        .update({ 
          stream_key: newKey,
          rtmp_url: RTMP_URL // Ensure RTMP URL is always up to date
        })
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
      setShowKey(true);
      toast.success("Stream key regenerated successfully");
    } catch (err: any) {
      console.error("Failed to regenerate stream key:", err);
      toast.error("Failed to regenerate stream key");
    } finally {
      setIsRegenerating(false);
    }
  };
  
  // Handle starting a stream
  const handleStartStream = async () => {
    if (!stream?.id) {
      toast.error("No stream available");
      return;
    }
    
    setIsStarting(true);
    
    try {
      // Update the stream to set is_live to true
      const { data, error } = await supabase
        .from('streams')
        .update({ 
          is_live: true, 
          started_at: new Date().toISOString(),
          rtmp_url: RTMP_URL // Ensure RTMP URL is always up to date
        })
        .eq('id', stream.id)
        .eq('user_id', user?.id)
        .select()
        .single();
      
      if (error) {
        console.error("Error starting stream:", error);
        throw error;
      }
      
      console.log("Stream started:", data);
      setStream(data);
      toast.success("Stream started successfully");
      
    } catch (err: any) {
      console.error("Failed to start stream:", err);
      toast.error("Failed to start stream");
    } finally {
      setIsStarting(false);
    }
  };
  
  // Handle ending a stream
  const handleEndStream = async () => {
    if (!stream?.id) {
      toast.error("No stream available");
      return;
    }
    
    try {
      // Update the stream to set is_live to false
      const { data, error } = await supabase
        .from('streams')
        .update({ 
          is_live: false, 
          ended_at: new Date().toISOString()
        })
        .eq('id', stream.id)
        .eq('user_id', user?.id)
        .select()
        .single();
      
      if (error) {
        console.error("Error ending stream:", error);
        throw error;
      }
      
      console.log("Stream ended:", data);
      setStream(data);
      toast.success("Stream ended successfully");
      
    } catch (err: any) {
      console.error("Failed to end stream:", err);
      toast.error("Failed to end stream");
    }
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-8 w-48" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-64" />
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-red-500">Stream Setup Error</CardTitle>
          <CardDescription>We encountered a problem setting up your stream</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <Info className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button 
            variant="outline" 
            className="mt-4 w-full"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Stream Dashboard</CardTitle>
        <CardDescription>
          Manage your stream settings and start broadcasting
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-sm font-medium mb-2">Stream URL</h3>
          <div className="flex items-center">
            <Input
              value={RTMP_URL}
              readOnly
              className="font-mono text-xs"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(RTMP_URL, "Stream URL")}
              className="ml-2 whitespace-nowrap"
            >
              <Copy className="h-4 w-4 mr-1" />
              Copy URL
            </Button>
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-medium mb-2">Stream Key</h3>
          <div className="flex items-center">
            <Input
              type={showKey ? "text" : "password"}
              value={stream?.stream_key || ""}
              readOnly
              className="font-mono text-xs"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowKey(!showKey)}
              className="ml-2"
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(stream?.stream_key || "", "Stream key")}
              className="ml-2 whitespace-nowrap"
            >
              <Copy className="h-4 w-4 mr-1" />
              Copy Key
            </Button>
          </div>
          <div className="flex gap-2 mt-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={handleRegenerateKey}
              disabled={isRegenerating}
            >
              {isRegenerating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate Key
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => {
                copyToClipboard(`${RTMP_URL}\n${stream?.stream_key || ""}`, "Stream URL and Key");
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy Both
            </Button>
          </div>
        </div>
        
        <Separator className="my-4" />
        
        <div className="bg-muted p-4 rounded-md space-y-3">
          <h3 className="font-medium text-sm">Quick OBS Setup</h3>
          <ol className="list-decimal pl-5 text-sm space-y-2">
            <li>Open OBS Studio</li>
            <li>Go to <strong>Settings → Stream</strong></li>
            <li>Select <strong>"Custom..."</strong> as the service</li>
            <li>Paste <strong>{RTMP_URL}</strong> as the Server</li>
            <li>Paste your stream key in the Stream Key field</li>
            <li>Click <strong>Apply</strong> then <strong>OK</strong></li>
            <li>Click <strong>"Start Streaming"</strong> in OBS</li>
          </ol>
          <Button 
            variant="default" 
            size="sm"
            className="mt-2 w-full"
            onClick={() => {
              copyToClipboard(`OBS Stream Settings:
Server: ${RTMP_URL}
Stream Key: ${stream?.stream_key || ""}`, "OBS Settings");
            }}
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy OBS Instructions
          </Button>
        </div>
        
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
          
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              Use the exact stream URL <strong>{RTMP_URL}</strong> in OBS.
              Make sure to keep your stream key secure and never share it publicly.
            </AlertDescription>
          </Alert>
          
          <div className="flex gap-2">
            {!stream?.is_live ? (
              <Button
                className="flex-1"
                onClick={handleStartStream}
                disabled={isStarting}
              >
                {isStarting ? (
                  <>Starting...</>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Start Stream
                  </>
                )}
              </Button>
            ) : (
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleEndStream}
              >
                End Stream
              </Button>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        For advanced stream settings, use OBS Studio or Streamlabs.
      </CardFooter>
      
      {/* Add the StreamerDashboardChat component */}
      {stream && <StreamerDashboardChat streamId={stream.id} isLive={stream.is_live} />}
    </Card>
  );
}
