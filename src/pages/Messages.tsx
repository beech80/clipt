
import React from "react";
import GameBoyControls from "@/components/GameBoyControls";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Messages = () => {
  const navigate = useNavigate();

  const handleSearchClick = () => {
    toast.info("Search functionality coming soon!");
  };

  return (
    <div className="container mx-auto p-4 min-h-screen relative pb-[200px]">
      <div className="gameboy-header">
        <h1 className="gameboy-title">MESSAGES</h1>
      </div>

      <div className="mt-20 grid grid-cols-1 h-[calc(100vh-8rem)]">
        <div className="gaming-card overflow-y-auto relative">
          {/* Empty state - ready for testing */}
          <div className="absolute top-4 right-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSearchClick}
              className="flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Search Users
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/post/new')}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Message
            </Button>
          </div>
        </div>
      </div>

      <GameBoyControls />
    </div>
  );
};

export default Messages;
