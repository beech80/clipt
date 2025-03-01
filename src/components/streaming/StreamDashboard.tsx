import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Copy, Eye, EyeOff, Play, Settings, Square } from 'lucide-react';
import { StreamSettings } from './StreamSettings';
import { createStream, startStream as startStreamService, regenerateStreamKey } from '@/services/streamService';

export const StreamDashboard = () => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [showKey, setShowKey] = useState(false);

  // Query to fetch the user's stream
  const { data: stream, refetch, isLoading } = useQuery({
    queryKey: ['user-stream', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('streams')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching stream:", error);
        throw error;
      }
      return data;
    },
    enabled: !!user
  });

  // Create stream mutation
  const createStreamMutation = useMutation({
    mutationFn: async (streamData: { title: string; description: string }) => {
      if (!user) throw new Error("User must be logged in");
      
      const { data, error } = await createStream({
        title: streamData.title,
        description: streamData.description
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Stream created successfully");
      refetch();
    },
    onError: (error) => {
      console.error("Error creating stream:", error);
      toast.error("Failed to create stream");
    }
  });

  // Start stream mutation
  const startStreamMutation = useMutation({
    mutationFn: async (streamId: string) => {
      const { data, error } = await startStreamService(streamId);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Stream started successfully");
      refetch();
    },
    onError: (error) => {
      console.error("Error starting stream:", error);
      toast.error("Failed to start stream");
    }
  });

  // Regenerate stream key mutation
  const regenerateKeyMutation = useMutation({
    mutationFn: async (streamId: string) => {
      const { data, error } = await regenerateStreamKey(streamId);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Stream key regenerated");
      refetch();
    },
    onError: (error) => {
      console.error("Error regenerating stream key:", error);
      toast.error("Failed to regenerate stream key");
    }
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success(`${label} copied to clipboard`))
      .catch(() => toast.error(`Failed to copy ${label}`));
  };

  const handleCreateStream = () => {
    if (!title.trim()) {
      toast.error("Please enter a stream title");
      return;
    }
    
    createStreamMutation.mutate({ 
      title: title.trim(), 
      description: description.trim() 
    });
  };

  const handleStartStream = () => {
    if (!stream?.id) {
      toast.error("Please create a stream first");
      return;
    }
    
    startStreamMutation.mutate(stream.id);
  };

  const handleRegenerateKey = () => {
    if (!stream?.id) {
      toast.error("No stream available");
      return;
    }
    
    regenerateKeyMutation.mutate(stream.id);
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold mb-6">Stream Dashboard</h1>
      
      {!stream ? (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Create a New Stream</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Stream Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter stream title"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description (Optional)</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter stream description"
                rows={3}
              />
            </div>
            <Button 
              onClick={handleCreateStream}
              disabled={createStreamMutation.isPending}
              className="w-full"
            >
              {createStreamMutation.isPending ? "Creating..." : "Create Stream"}
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Stream Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Stream Title</label>
                <div className="font-medium">{stream.title}</div>
              </div>
              
              {stream.description && (
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <div className="text-sm">{stream.description}</div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  stream.is_live 
                    ? "bg-green-100 text-green-800" 
                    : "bg-gray-100 text-gray-800"
                }`}>
                  {stream.is_live ? "Live" : "Offline"}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">OBS Stream Settings</h2>
            <p className="text-sm text-gray-500 mb-4">
              Use these settings in OBS Studio to connect to your stream
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">RTMP URL</label>
                <div className="flex">
                  <Input 
                    value={stream.rtmp_url || "rtmp://stream.clipt.app/live"} 
                    readOnly 
                    className="flex-1"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="ml-2"
                    onClick={() => copyToClipboard(stream.rtmp_url || "rtmp://stream.clipt.app/live", "RTMP URL")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Stream Key</label>
                <div className="flex">
                  <Input 
                    type={showKey ? "text" : "password"}
                    value={stream.stream_key || ""}
                    readOnly 
                    className="flex-1"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="ml-2"
                    onClick={() => setShowKey(!showKey)}
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="ml-2"
                    onClick={() => copyToClipboard(stream.stream_key || "", "Stream Key")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={handleRegenerateKey}
                  disabled={regenerateKeyMutation.isPending}
                >
                  {regenerateKeyMutation.isPending ? "Regenerating..." : "Regenerate Stream Key"}
                </Button>
                <p className="text-xs text-gray-500 mt-1">
                  Warning: Regenerating will invalidate your current stream key
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Stream Controls</h2>
            <div className="flex gap-4">
              <Button
                className={`flex-1 ${stream.is_live ? 'bg-gray-600' : 'bg-red-600 hover:bg-red-700'}`}
                disabled={stream.is_live || startStreamMutation.isPending}
                onClick={handleStartStream}
              >
                <Play className="mr-2 h-4 w-4" />
                {startStreamMutation.isPending ? "Starting..." : "Start Stream"}
              </Button>
              
              <Button
                variant="outline" 
                className="flex-1"
                disabled={!stream.is_live}
              >
                <Square className="mr-2 h-4 w-4" />
                End Stream
              </Button>
            </div>
            
            <div className="mt-4">
              <p className="text-sm text-gray-500">
                To start streaming, configure OBS with your RTMP URL and Stream Key, then click "Start Stream".
              </p>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};
