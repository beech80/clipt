import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useUser } from '@/hooks/useUser';
import { supabase } from '@/supabaseClient';
import { toast } from 'sonner';
import { Video, Upload, Eye, Calendar, Settings, Plus } from 'lucide-react';
import StreamUploader from '@/components/StreamUploader';
import StreamPlayer from '@/components/StreamPlayer';
import { cloudflareStreamService } from '@/services/cloudflareStreamService';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Stream {
  id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  stream_url?: string;
  created_at: string;
  viewer_count?: number;
  is_live: boolean;
  stream_settings?: any;
}

const StreamingCenter: React.FC = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('myStreams');
  const [streams, setStreams] = useState<Stream[]>([]);
  const [liveStreams, setLiveStreams] = useState<Stream[]>([]);
  const [popularStreams, setPopularStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStream, setSelectedStream] = useState<Stream | null>(null);
  const [showUploader, setShowUploader] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    const loadStreams = async () => {
      setLoading(true);
      try {
        // Get user's streams
        const { data: userStreams, error: userStreamsError } = await supabase
          .from('streams')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (userStreamsError) throw userStreamsError;
        setStreams(userStreams || []);

        // Get live streams
        const { data: activeStreams, error: liveError } = await supabase
          .from('streams')
          .select('*')
          .eq('is_live', true)
          .order('viewer_count', { ascending: false })
          .limit(10);

        if (liveError) throw liveError;
        setLiveStreams(activeStreams || []);

        // Get popular streams (by view count)
        const { data: topStreams, error: popularError } = await supabase
          .from('streams')
          .select('*')
          .order('viewer_count', { ascending: false })
          .limit(10);

        if (popularError) throw popularError;
        setPopularStreams(topStreams || []);

      } catch (error) {
        console.error('Error loading streams:', error);
        toast.error('Failed to load streams');
      } finally {
        setLoading(false);
      }
    };

    loadStreams();
  }, [user]);

  const handleUploadSuccess = (videoId: string) => {
    // Refresh the streams list
    if (user) {
      supabase
        .from('streams')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          if (data) {
            setStreams(data);
            setShowUploader(false);
            toast.success('Stream uploaded successfully!');
          }
        });
    }
  };

  const handleDeleteStream = async (streamId: string) => {
    try {
      // First get the stream to find the Cloudflare video ID
      const { data: stream } = await supabase
        .from('streams')
        .select('*')
        .eq('id', streamId)
        .single();
      
      if (stream?.stream_settings?.videoId) {
        // Delete from Cloudflare
        await cloudflareStreamService.deleteVideo(stream.stream_settings.videoId);
      }

      // Delete from database
      const { error } = await supabase
        .from('streams')
        .delete()
        .eq('id', streamId);

      if (error) throw error;
      
      // Update the streams list
      setStreams(streams.filter(s => s.id !== streamId));
      toast.success('Stream deleted successfully');
      
      if (selectedStream?.id === streamId) {
        setSelectedStream(null);
      }
    } catch (error) {
      console.error('Error deleting stream:', error);
      toast.error('Failed to delete stream');
    }
  };

  // Don't render until we have a user
  if (!user) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center">
        <p>Please sign in to access streaming features</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Streaming Center</h1>
          <p className="text-muted-foreground">
            Upload, manage and watch streams
          </p>
        </div>
        
        <Dialog open={showUploader} onOpenChange={setShowUploader}>
          <DialogTrigger asChild>
            <Button className="mt-4 sm:mt-0" onClick={() => setShowUploader(true)}>
              <Upload className="h-4 w-4 mr-2" /> Upload Stream
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Upload New Stream</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <StreamUploader 
                onSuccess={handleUploadSuccess}
                maxSize={500}
                className="border-0 shadow-none"
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="myStreams" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            <span>My Streams</span>
          </TabsTrigger>
          <TabsTrigger value="live" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <span>Live Now</span>
          </TabsTrigger>
          <TabsTrigger value="popular" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Popular</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="myStreams" className="space-y-6">
          {loading ? (
            <div className="space-y-4">
              <Card className="animate-pulse">
                <CardContent className="h-32"></CardContent>
              </Card>
              <Card className="animate-pulse">
                <CardContent className="h-32"></CardContent>
              </Card>
            </div>
          ) : streams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {streams.map(stream => (
                <Card key={stream.id} className="overflow-hidden">
                  <div 
                    className="aspect-video cursor-pointer relative" 
                    onClick={() => setSelectedStream(stream)}
                  >
                    {stream.thumbnail_url ? (
                      <img 
                        src={stream.thumbnail_url} 
                        alt={stream.title} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Video className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                    
                    {stream.is_live && (
                      <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 text-xs rounded-md">
                        LIVE
                      </div>
                    )}
                  </div>
                  
                  <CardContent className="p-4">
                    <h3 className="font-medium line-clamp-1">{stream.title}</h3>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-sm text-muted-foreground">
                        {new Date(stream.created_at).toLocaleDateString()}
                      </p>
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {stream.viewer_count || 0}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-muted/30">
              <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                <Video className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No streams yet</h3>
                <p className="text-muted-foreground mb-4">
                  Upload your first stream to get started
                </p>
                <Button onClick={() => setShowUploader(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Create Stream
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="live" className="space-y-6">
          {loading ? (
            <div className="space-y-4">
              <Card className="animate-pulse">
                <CardContent className="h-32"></CardContent>
              </Card>
            </div>
          ) : liveStreams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveStreams.map(stream => (
                <Card key={stream.id} className="overflow-hidden">
                  <div 
                    className="aspect-video cursor-pointer relative" 
                    onClick={() => setSelectedStream(stream)}
                  >
                    {stream.thumbnail_url ? (
                      <img 
                        src={stream.thumbnail_url} 
                        alt={stream.title} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Video className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                    
                    <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 text-xs rounded-md">
                      LIVE
                    </div>
                    
                    {stream.viewer_count && stream.viewer_count > 0 && (
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 text-xs rounded-md flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {stream.viewer_count}
                      </div>
                    )}
                  </div>
                  
                  <CardContent className="p-4">
                    <h3 className="font-medium line-clamp-1">{stream.title}</h3>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-muted/30">
              <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                <Video className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No live streams right now</h3>
                <p className="text-muted-foreground">
                  Check back later or start your own stream
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="popular" className="space-y-6">
          {loading ? (
            <div className="space-y-4">
              <Card className="animate-pulse">
                <CardContent className="h-32"></CardContent>
              </Card>
            </div>
          ) : popularStreams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularStreams.map(stream => (
                <Card key={stream.id} className="overflow-hidden">
                  <div 
                    className="aspect-video cursor-pointer relative" 
                    onClick={() => setSelectedStream(stream)}
                  >
                    {stream.thumbnail_url ? (
                      <img 
                        src={stream.thumbnail_url} 
                        alt={stream.title} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Video className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                    
                    {stream.is_live && (
                      <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 text-xs rounded-md">
                        LIVE
                      </div>
                    )}
                    
                    {stream.viewer_count && stream.viewer_count > 0 && (
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 text-xs rounded-md flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {stream.viewer_count}
                      </div>
                    )}
                  </div>
                  
                  <CardContent className="p-4">
                    <h3 className="font-medium line-clamp-1">{stream.title}</h3>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-muted/30">
              <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                <Video className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No popular streams yet</h3>
                <p className="text-muted-foreground">
                  Check back later or upload some content
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      
      {selectedStream && (
        <Dialog open={!!selectedStream} onOpenChange={(open) => !open && setSelectedStream(null)}>
          <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
            <div className="space-y-4">
              <StreamPlayer
                videoId={selectedStream.stream_settings?.videoId || ''}
                title={selectedStream.title}
                className="w-full"
                autoPlay={true}
                muted={false}
                posterUrl={selectedStream.thumbnail_url}
              />
              
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">{selectedStream.title}</h2>
                {selectedStream.description && (
                  <p className="text-muted-foreground">{selectedStream.description}</p>
                )}
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                {streams.some(s => s.id === selectedStream.id) && (
                  <Button 
                    variant="destructive" 
                    onClick={() => handleDeleteStream(selectedStream.id)}
                  >
                    Delete Stream
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default StreamingCenter;
