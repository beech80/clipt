
import React from "react";
import GameBoyControls from "@/components/GameBoyControls";

const Messages = () => {
  return (
    <div className="container mx-auto p-4 min-h-screen relative pb-[200px]">
      <div className="gameboy-header">
        <h1 className="gameboy-title">MESSAGES</h1>
      </div>

      <div className="mt-20 grid grid-cols-1 h-[calc(100vh-8rem)]">
        <div className="gaming-card overflow-y-auto">
          {/* Empty state - ready for testing */}
        </div>
      </div>

      <GameBoyControls />
    </div>
  );
};

export default Messages;
