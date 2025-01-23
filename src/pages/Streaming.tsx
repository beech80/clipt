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
      <div className="min-h-screen bg-gaming-800 text-white">
        <div className="container mx-auto p-4">
          <Card className="gaming-card p-8 text-center space-y-4">
            <h2 className="text-2xl font-bold gaming-gradient-text">Please Login</h2>
            <p className="text-gaming-300">
              You need to be logged in to access streaming features.
            </p>
          </Card>
        </div>
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
      className="min-h-screen bg-gaming-800 text-white container mx-auto p-4 space-y-6"
    >
      <div className="gaming-card p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BackButton />
            <h1 className="text-2xl font-bold gaming-gradient-text">Streaming Studio</h1>
          </div>
          <div className="flex items-center gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="gaming-button gap-2">
                  <Calendar className="h-4 w-4" />
                  Schedule Stream
                </Button>
              </DialogTrigger>
              <DialogContent className="gaming-card">
                <StreamScheduleForm streamId={user.id} />
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="gaming-button gap-2">
                  <Settings className="h-4 w-4" />
                  Stream Settings
                </Button>
              </DialogTrigger>
              <DialogContent className="gaming-card">
                <StreamSettings userId={user.id} />
              </DialogContent>
            </Dialog>

            <Button 
              onClick={() => setIsLive(!isLive)}
              variant={isLive ? "destructive" : "default"}
              className="gaming-button gap-2 min-w-[120px] transition-all duration-300"
            >
              <Video className="h-4 w-4" />
              {isLive ? "End Stream" : "Go Live"}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-3 space-y-6"
        >
          <Card className="gaming-card overflow-hidden">
            <StreamPlayer 
              isLive={isLive}
              autoplay={true}
              controls={true}
            />
          </Card>
          
          {!isLive && (
            <Card className="gaming-card p-6">
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
            <Card className="gaming-card p-6">
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
          <Card className="gaming-card h-full">
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