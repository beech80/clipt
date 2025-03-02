import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Eye, EyeOff, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

// This is a simplified standalone page just for stream setup
export default function StreamSetup() {
  const { user } = useAuth();
  const [stream, setStream] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Define the RTMP URL - this is the server URL for OBS
  const RTMP_URL = "rtmp://stream.clipt.live/live";

  // Function to copy text to clipboard
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard!`);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error(`Failed to copy ${label}`);
    }
  };

  // Function to generate a random stream key
  const generateRandomKey = async () => {
    try {
      // Call RPC function if available
      const { data, error } = await supabase.rpc('generate_stream_key');
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error generating key via RPC, using fallback:', err);
      // Fallback to client-side generation
      const array = new Uint8Array(18);
      window.crypto.getRandomValues(array);
      return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
    }
  };

  // Regenerate stream key
  const handleRegenerateKey = async () => {
    if (!user || !stream) return;
    
    setIsRegenerating(true);
    
    try {
      const newKey = await generateRandomKey();
      
      const { data, error } = await supabase
        .from('streams')
        .update({ stream_key: newKey })
        .eq('id', stream.id)
        .select()
        .single();
      
      if (error) throw error;
      
      setStream(data);
      toast.success('Stream key regenerated successfully!');
    } catch (err: any) {
      console.error('Error regenerating stream key:', err);
      toast.error('Failed to regenerate stream key');
    } finally {
      setIsRegenerating(false);
    }
  };

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
          .maybeSingle();
        
        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error("Error fetching stream:", fetchError);
          throw fetchError;
        }
        
        if (existingStream) {
          console.log("Existing stream found:", existingStream);
          // Ensure the RTMP URL is always up to date
          if (existingStream.rtmp_url !== RTMP_URL) {
            const { data: updatedStream, error: updateError } = await supabase
              .from('streams')
              .update({ rtmp_url: RTMP_URL })
              .eq('id', existingStream.id)
              .select()
              .single();
              
            if (updateError) {
              console.error("Error updating RTMP URL:", updateError);
            } else {
              existingStream.rtmp_url = RTMP_URL;
            }
          }
          setStream(existingStream);
        } else {
          console.log("No stream found, attempting to create new stream");
          
          // Verify user exists in the database first
          const { data: userExists, error: userCheckError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .single();
            
          if (userCheckError) {
            console.error("User profile does not exist:", userCheckError);
            setError("Your user profile needs to be created first. Please try visiting your profile page.");
            setIsLoading(false);
            return;
          }
          
          // Create new stream with default values and add created_at/updated_at timestamps
          const streamKey = await generateRandomKey();
          const timestamp = new Date().toISOString();
          
          // Log the data we're about to insert
          const streamData = {
            user_id: user.id,
            title: `${user.user_metadata?.username || user.email}'s Stream`,
            description: "Welcome to my stream!",
            is_live: false,
            stream_key: streamKey,
            rtmp_url: RTMP_URL,
            viewer_count: 0,
            created_at: timestamp,
            updated_at: timestamp
          };
          
          console.log("Creating stream with data:", streamData);
          
          const { data: newStream, error: createError } = await supabase
            .from('streams')
            .insert(streamData)
            .select()
            .single();
          
          if (createError) {
            console.error("Error creating stream:", createError);
            
            // Provide more helpful error message
            if (createError.message.includes("foreign key constraint")) {
              setError("Unable to create stream due to user profile issues. Please try visiting your profile page first.");
            } else {
              setError(`Failed to create stream: ${createError.message}`);
            }
            
            setIsLoading(false);
            return;
          }
          
          console.log("New stream created:", newStream);
          setStream(newStream);
        }
      } catch (err: any) {
        console.error("Error in fetchOrCreateStream:", err);
        setError(err.message || "Failed to setup streaming");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrCreateStream();
  }, [user]);

  if (!user) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Authentication Required</AlertTitle>
        <AlertDescription>Please log in to access streaming features.</AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Loading Stream Settings...</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Stream Setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error ? (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          
          {/* Temporary hardcoded solution while we fix the database issues */}
          <div className="bg-yellow-900/30 p-4 rounded-md border border-yellow-600/30 mb-4">
            <h2 className="text-lg font-semibold mb-2 text-yellow-400">⚠️ Temporary Stream Details</h2>
            <p className="text-gray-200 mb-2">
              While we're fixing some database issues, you can use these temporary stream details:
            </p>
          </div>
          
          <div className="bg-blue-950/30 p-4 rounded-md border border-blue-600/30">
            <h2 className="text-lg font-semibold mb-2 text-blue-400">How to Stream</h2>
            <ol className="list-decimal ml-5 space-y-1 text-gray-200">
              <li>Copy your Stream URL and Stream Key from below</li>
              <li>Open OBS Studio (or other streaming software)</li>
              <li>Go to Settings → Stream</li>
              <li>Select "Custom..." as the service</li>
              <li>Paste the Stream URL as the "Server"</li>
              <li>Paste your Stream Key in the "Stream Key" field</li>
              <li>Click "Apply" and then "OK"</li>
              <li>Click "Start Streaming" in OBS when ready</li>
            </ol>
          </div>

          <Separator />
          
          {/* Stream URL Section */}
          <div>
            <h3 className="text-md font-medium mb-2">Stream URL</h3>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                value={RTMP_URL}
                readOnly
                className="font-mono bg-black/20 border-gray-700"
              />
              <Button
                onClick={() => copyToClipboard(RTMP_URL, "Stream URL")}
                className="whitespace-nowrap"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy URL
              </Button>
            </div>
          </div>
          
          {/* Stream Key Section */}
          <div>
            <h3 className="text-md font-medium mb-2">Stream Key</h3>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-grow">
                <Input
                  type={showKey ? "text" : "password"}
                  // Use a hardcoded stream key for now if the database one isn't available
                  value={stream?.stream_key || "clipt-temporary-stream-key-123456"}
                  readOnly
                  className="font-mono pr-10 bg-black/20 border-gray-700"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button
                onClick={() => copyToClipboard(stream?.stream_key || "clipt-temporary-stream-key-123456", "Stream Key")}
                className="whitespace-nowrap"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Key
              </Button>
            </div>
            
            <div className="flex gap-2 mt-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={handleRegenerateKey}
                disabled={isRegenerating || !stream}
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
                className="flex-1"
                onClick={() => {
                  copyToClipboard(`Server: ${RTMP_URL}\nStream Key: ${stream?.stream_key || "clipt-temporary-stream-key-123456"}`, "All Stream Info");
                }}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy Both
              </Button>
            </div>
          </div>
          
          <Separator />
          
          {/* Quick Copy Section */}
          <div className="pt-2">
            <Button 
              variant="secondary" 
              size="lg"
              className="w-full"
              onClick={() => {
                copyToClipboard(`OBS STREAM SETTINGS:
Server: ${RTMP_URL}
Stream Key: ${stream?.stream_key || "clipt-temporary-stream-key-123456"}

INSTRUCTIONS:
1. Open OBS Studio
2. Go to Settings → Stream
3. Select "Custom..." as service
4. Paste Server and Stream Key in respective fields
5. Click Apply, then OK
6. Click "Start Streaming" when ready`, "Complete OBS Setup Guide");
              }}
            >
              <Copy className="mr-2 h-5 w-5" />
              Copy Complete OBS Setup Guide
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
