import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StreamPlayer } from "@/components/streaming/StreamPlayer";
import { StreamChat } from "@/components/streaming/StreamChat";
import { StreamForm } from "@/components/streaming/StreamForm";
import { StreamControls } from "@/components/streaming/StreamControls";
import { StreamSettings } from "@/components/streaming/StreamSettings";
import { StreamScheduleForm } from "@/components/streaming/StreamScheduleForm";
import { Calendar, Settings } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { BackButton } from "@/components/ui/back-button";
import { Card } from "@/components/ui/card";

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

  const handleStreamUpdate = () => {
    // Handle stream update logic
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
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
        </div>
        
        <div className="lg:col-span-1">
          <Card className="h-full">
            <StreamChat 
              streamId={user.id} 
              isLive={isLive} 
              chatEnabled={true}
            />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Streaming;