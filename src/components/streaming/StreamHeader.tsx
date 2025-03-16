
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PanelTop, Calendar, Radio, Settings } from "lucide-react";

export function StreamHeader() {
  const navigate = useNavigate();

  return (
    <Card className="bg-[#1e1a2e] border-gray-700">
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <CardTitle className="text-2xl font-bold text-white">Streaming</CardTitle>
          <CardDescription className="text-gray-400">Manage your streams and broadcasts</CardDescription>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <Button 
            variant="default" 
            onClick={() => navigate('/stream-setup')}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Settings className="mr-2 h-4 w-4" />
            Stream Setup
          </Button>
        </div>
      </CardHeader>
      <div className="px-6 pb-4">
        <Tabs defaultValue="streaming" className="space-y-4">
          <TabsList className="grid grid-cols-3 sm:w-[400px] bg-[#252040]">
            <TabsTrigger value="streaming" onClick={() => navigate('/streaming')} className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <Radio className="mr-2 h-4 w-4" />
              Live
            </TabsTrigger>
            <TabsTrigger value="broadcasting" onClick={() => navigate('/broadcasting')} className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <PanelTop className="mr-2 h-4 w-4" />
              Broadcast
            </TabsTrigger>
            <TabsTrigger value="schedule" onClick={() => navigate('/schedule')} className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <Calendar className="mr-2 h-4 w-4" />
              Schedule
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </Card>
  );
}
