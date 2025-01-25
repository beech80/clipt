import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StreamPlayer } from "@/components/streaming/StreamPlayer";
import { StreamChat } from "@/components/streaming/StreamChat";
import { StreamForm } from "@/components/streaming/StreamForm";
import { StreamControls } from "@/components/streaming/StreamControls";
import { StreamSettings } from "@/components/streaming/StreamSettings";
import { StreamScheduleForm } from "@/components/streaming/StreamScheduleForm";
import { EnhancedStreamDashboard } from "@/components/streaming/EnhancedStreamDashboard";
import { SceneManager } from "@/components/streaming/SceneManager";
import { BroadcastSettings } from "@/components/streaming/BroadcastSettings";
import { BroadcastEngine } from "@/components/streaming/broadcast/BroadcastEngine";
import { Calendar, Settings, Layout, Users, Activity } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { BackButton } from "@/components/ui/back-button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Streaming = () => {
  const [isLive, setIsLive] = useState(false);
  const { user } = useAuth();
  const [streamData, setStreamData] = useState({
    title: "",
    description: "",
  });

  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Please Login</h2>
          <p className="text-muted-foreground">
            You need to be logged in to access streaming features.
          </p>
        </Card>
      </div>
    );
  }

  const handleStreamUpdate = (data: { isLive: boolean }) => {
    setIsLive(data.isLive);
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <BackButton />
          <h1 className="text-2xl font-bold">Streaming Studio</h1>
        </div>
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Calendar className="h-4 w-4" />
                Schedule Stream
              </Button>
            </DialogTrigger>
            <DialogContent>
              <StreamScheduleForm streamId={user.id} />
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Settings className="h-4 w-4" />
                Stream Settings
              </Button>
            </DialogTrigger>
            <DialogContent>
              <StreamSettings userId={user.id} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <Tabs defaultValue="stream" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="stream">
                <Layout className="h-4 w-4 mr-2" />
                Stream
              </TabsTrigger>
              <TabsTrigger value="scenes">
                <Layout className="h-4 w-4 mr-2" />
                Scenes
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="h-4 w-4 mr-2" />
                Broadcast Settings
              </TabsTrigger>
              <TabsTrigger value="dashboard">
                <Activity className="h-4 w-4 mr-2" />
                Dashboard
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="stream">
              <Card className="overflow-hidden">
                <StreamPlayer 
                  isLive={isLive}
                  autoplay={true}
                  controls={true}
                />
              </Card>
              
              <Card className="p-6">
                {!isLive ? (
                  <div className="space-y-6">
                    <StreamForm
                      title={streamData.title}
                      description={streamData.description}
                      onTitleChange={(title) => setStreamData({ ...streamData, title })}
                      onDescriptionChange={(description) => 
                        setStreamData({ ...streamData, description })
                      }
                    />
                    <StreamControls 
                      userId={user.id}
                      isLive={isLive}
                      onStreamUpdate={handleStreamUpdate}
                    />
                  </div>
                ) : (
                  <StreamControls 
                    userId={user.id}
                    isLive={isLive}
                    onStreamUpdate={handleStreamUpdate}
                  />
                )}
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <BroadcastEngine 
                streamId={user.id} 
                userId={user.id} 
              />
              <BroadcastSettings />
            </TabsContent>

            <TabsContent value="dashboard">
              <EnhancedStreamDashboard userId={user.id} isLive={isLive} />
            </TabsContent>
          </Tabs>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-6">
          <Card className="h-[calc(100vh-12rem)]">
            <div className="flex flex-col h-full">
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <h3 className="font-semibold">Stream Chat</h3>
                </div>
                {isLive && (
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-sm text-red-500 font-medium">LIVE</span>
                  </div>
                )}
              </div>
              <StreamChat 
                streamId={user.id} 
                isLive={isLive} 
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Streaming;
