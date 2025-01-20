import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StreamPlayer } from "@/components/streaming/StreamPlayer";
import { StreamChat } from "@/components/streaming/StreamChat";
import { StreamForm } from "@/components/streaming/StreamForm";
import { StreamControls } from "@/components/streaming/StreamControls";
import { StreamSettings } from "@/components/streaming/StreamSettings";
import { StreamScheduleForm } from "@/components/streaming/StreamScheduleForm";
import { Calendar, Settings, Video } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { BackButton } from "@/components/ui/back-button";

const Streaming = () => {
  const [isLive, setIsLive] = useState(false);
  const { user } = useAuth();
  const [streamData, setStreamData] = useState({
    title: "",
    description: "",
  });

  if (!user) return null;

  const handleStreamUpdate = () => {
    // Handle stream update logic
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <BackButton />
          <h1 className="text-2xl font-bold">Streaming</h1>
        </div>
        <div className="space-x-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Stream
              </Button>
            </DialogTrigger>
            <DialogContent>
              <StreamScheduleForm streamId={user.id} />
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Stream Settings
              </Button>
            </DialogTrigger>
            <DialogContent>
              <StreamSettings userId={user.id} />
            </DialogContent>
          </Dialog>

          <Button onClick={() => setIsLive(!isLive)}>
            <Video className="h-4 w-4 mr-2" />
            {isLive ? "End Stream" : "Go Live"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 space-y-4">
          <StreamPlayer />
          {!isLive && (
            <StreamForm
              title={streamData.title}
              description={streamData.description}
              onTitleChange={(title) => setStreamData({ ...streamData, title })}
              onDescriptionChange={(description) => setStreamData({ ...streamData, description })}
            />
          )}
          {isLive && <StreamControls onStreamUpdate={handleStreamUpdate} />}
        </div>
        <div className="lg:col-span-1">
          <StreamChat streamId={user.id} isLive={isLive} chatEnabled={true} />
        </div>
      </div>
    </div>
  );
};

export default Streaming;
