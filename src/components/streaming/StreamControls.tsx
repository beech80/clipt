import { useState } from "react";
import { Video, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { StreamForm } from "./StreamForm";
import { startStream, endStream } from "@/utils/streamUtils";
import { useAuth } from "@/contexts/AuthContext";

interface StreamControlsProps {
  userId?: string;
  isLive?: boolean;
  onStreamUpdate: (data: { isLive: boolean; streamKey: string | null; streamUrl: string | null }) => void;
}

export const StreamControls = ({ userId, isLive = false, onStreamUpdate }: StreamControlsProps) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleStartStream = async () => {
    if (!userId) {
      toast.error("Please log in to start streaming");
      return;
    }

    if (!title) {
      toast.error("Please set a stream title first");
      return;
    }

    setIsLoading(true);
    try {
      const result = await startStream(userId, title, description);
      onStreamUpdate(result);
      toast.success("Stream started successfully!");
    } catch (error) {
      console.error("Error starting stream:", error);
      toast.error("Failed to start stream");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndStream = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const result = await endStream(userId);
      onStreamUpdate(result);
      toast.success("Stream ended successfully!");
    } catch (error) {
      console.error("Error ending stream:", error);
      toast.error("Failed to end stream");
    } finally {
      setIsLoading(false);
    }
  };

  // Only show stream controls if user is logged in and it's their stream
  if (!user || user.id !== userId) {
    return null;
  }

  return (
    <div className="space-y-4 mb-6">
      <StreamForm
        title={title}
        description={description}
        onTitleChange={setTitle}
        onDescriptionChange={setDescription}
      />
      {!isLive ? (
        <Button 
          onClick={handleStartStream}
          className="w-full bg-gaming-500 hover:bg-gaming-600"
          disabled={isLoading}
        >
          <Video className="h-4 w-4 mr-2" />
          Start Stream
        </Button>
      ) : (
        <Button 
          onClick={handleEndStream}
          className="w-full bg-red-500 hover:bg-red-600"
          disabled={isLoading}
        >
          <Video className="h-4 w-4 mr-2" />
          End Stream
        </Button>
      )}
    </div>
  );
};