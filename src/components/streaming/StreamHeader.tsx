
import React from 'react';
import { Calendar, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { useNavigate } from "react-router-dom";

export function StreamHeader() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <BackButton />
        <h1 className="text-3xl font-bold">Streaming Dashboard</h1>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate('/schedule')}
          title="Schedule Stream"
        >
          <Calendar className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate('/broadcasting')}
          title="Broadcasting Setup"
        >
          <Radio className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
