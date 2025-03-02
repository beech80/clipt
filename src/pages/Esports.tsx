import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { TeamManagement } from "@/components/esports/TeamManagement";
import { Card } from "@/components/ui/card";
import { BackButton } from "@/components/ui/back-button";

const Esports = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Please Login</h2>
          <p className="text-muted-foreground">
            You need to be logged in to access esports features.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6 pb-40">
      <div className="flex items-center gap-4">
        <BackButton />
        <h1 className="text-2xl font-bold">Esports Management</h1>
      </div>

      <TeamManagement />
    </div>
  );
}

export default Esports;