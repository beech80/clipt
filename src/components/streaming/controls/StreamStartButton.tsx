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
      className="w-full bg-red-500 hover:bg-red-600 text-white px-8 py-6 text-xl font-bold rounded-lg"
      disabled={isLoading}
    >
      <Video className="h-6 w-6 mr-3" />
      Go Live
    </Button>
  );
};