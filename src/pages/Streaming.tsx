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
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

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
        <Card className="p-8 text-center space-y-4 bg-card/50 backdrop-blur-sm border border-border/50">
          <h2 className="text-2xl font-bold">Please Login</h2>
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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto p-4 space-y-6"
    >
      <div className="flex justify-between items-center bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4">
        <div className="flex items-center gap-2">
          <BackButton />
          <h1 className="text-2xl font-bold">Streaming Studio</h1>
        </div>
        <div className="flex items-center gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 hover:bg-accent">
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
              <Button variant="outline" className="gap-2 hover:bg-accent">
                <Settings className="h-4 w-4" />
                Stream Settings
              </Button>
            </DialogTrigger>
            <DialogContent>
              <StreamSettings userId={user.id} />
            </DialogContent>
          </Dialog>

          <Button 
            onClick={() => setIsLive(!isLive)}
            variant={isLive ? "destructive" : "default"}
            className="gap-2 min-w-[120px] transition-all duration-300"
          >
            <Video className="h-4 w-4" />
            {isLive ? "End Stream" : "Go Live"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-3 space-y-6"
        >
          <Card className="overflow-hidden border border-border/50 rounded-xl">
            <StreamPlayer 
              isLive={isLive}
              autoplay={true}
              controls={true}
            />
          </Card>
          
          {!isLive && (
            <Card className="p-6 bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl">
              <StreamForm
                title={streamData.title}
                description={streamData.description}
                onTitleChange={(title) => setStreamData({ ...streamData, title })}
                onDescriptionChange={(description) => 
                  setStreamData({ ...streamData, description })
                }
              />
            </Card>
          )}
          
          {isLive && (
            <Card className="p-6 bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl">
              <StreamControls 
                userId={user.id}
                isLive={isLive}
                onStreamUpdate={handleStreamUpdate}
              />
            </Card>
          )}
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1"
        >
          <Card className="h-full bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl">
            <StreamChat 
              streamId={user.id} 
              isLive={isLive} 
              chatEnabled={true}
            />
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Streaming;