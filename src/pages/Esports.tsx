import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { TeamManagement } from "@/components/esports/TeamManagement";
import { Card } from "@/components/ui/card";
import { BackButton } from "@/components/ui/back-button";
import GameBoyControls from "@/components/GameBoyControls";

const Esports = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <Card className="p-8 text-center bg-gaming-900/95 text-gaming-100 border-gaming-400/30">
          <h2 className="text-2xl font-bold mb-4">Please Login</h2>
          <p className="text-gaming-400">
            You need to be logged in to access esports features.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6 pb-40 min-h-screen bg-[#1A1F2C]">
      <div className="flex items-center gap-4">
        <BackButton />
        <h1 className="text-2xl font-bold text-gaming-100">Esports Management</h1>
      </div>

      <div className="bg-gaming-900/95 rounded-lg p-6 border border-gaming-400/30 backdrop-blur-sm">
        <TeamManagement />
      </div>
      
      <GameBoyControls />
    </div>
  );
}

export default Esports;