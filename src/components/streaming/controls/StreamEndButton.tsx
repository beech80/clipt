import { Button } from "@/components/ui/button";
import { Video } from "lucide-react";

interface StreamEndButtonProps {
  onClick: () => void;
  isLoading: boolean;
}

export const StreamEndButton = ({ onClick, isLoading }: StreamEndButtonProps) => {
  return (
    <Button 
      onClick={onClick}
      className="w-full bg-red-500 hover:bg-red-600 text-white"
      disabled={isLoading}
    >
      <Video className="h-4 w-4 mr-2" />
      End Stream
    </Button>
  );
};