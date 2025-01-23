import { Button } from "@/components/ui/button";
import { Video } from "lucide-react";

interface StreamStartButtonProps {
  onClick: () => void;
  isLoading: boolean;
}

export const StreamStartButton = ({ onClick, isLoading }: StreamStartButtonProps) => {
  return (
    <Button
      className="w-full bg-gaming-500 hover:bg-gaming-600 text-white px-8 py-6 text-lg"
      onClick={onClick}
      disabled={isLoading}
    >
      <Video className="w-5 h-5 mr-2" />
      {isLoading ? "Starting Stream..." : "Start Stream"}
    </Button>
  );
};