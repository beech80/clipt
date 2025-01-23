import { Button } from "@/components/ui/button";
import { Video } from "lucide-react";

interface StreamStartButtonProps {
  onClick: () => void;
  isLoading: boolean;
}

export const StreamStartButton = ({ onClick, isLoading }: StreamStartButtonProps) => {
  return (
    <Button 
      onClick={onClick}
      className="w-full bg-gaming-500 hover:bg-gaming-600 text-white px-8 py-6 text-lg"
      disabled={isLoading}
    >
      <Video className="h-5 w-5 mr-2" />
      Start Stream
    </Button>
  );
};