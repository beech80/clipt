import { Button } from "@/components/ui/button";
import { Video } from "lucide-react";

interface StreamEndButtonProps {
  onClick: () => void;
  isLoading: boolean;
}

export const StreamEndButton = ({ onClick, isLoading }: StreamEndButtonProps) => {
  return (
    <Button
      variant="destructive"
      className="w-full px-8 py-6 text-lg"
      onClick={onClick}
      disabled={isLoading}
    >
      <Video className="w-5 h-5 mr-2" />
      {isLoading ? "Ending Stream..." : "End Stream"}
    </Button>
  );
};