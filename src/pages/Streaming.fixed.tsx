import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Copy, Eye, EyeOff, Calendar, Settings2, Play, Clock, ChartBar, Layers } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { StreamChat } from "@/components/streaming/StreamChat";
import { StreamDashboard } from "@/components/streaming/StreamDashboard";
import { EnhancedGamingDashboard } from "@/components/streaming/EnhancedGamingDashboard";
import { ChatModerationDashboard } from "@/components/streaming/moderation/ChatModerationDashboard";
import '@/styles/streaming.css';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Streaming() {
  const { user } = useAuth();
  const [showKey, setShowKey] = useState(false);
  const [activeTab, setActiveTab] = useState("live");
  
  // Stream settings
  const RTMP_URL = "rtmp://live.clipt.cc/live";
  const STREAM_KEY = "live_5f9b3a2e1d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a";
  
  // Example schedule data - in real app, this would come from API
  const [scheduleItems, setScheduleItems] = useState([
    {
      id: 1,
      title: "Weekly Gaming Session",
      date: "Tuesday, March 5, 2025",
      time: "7:00 PM - 9:00 PM",
      description: "Playing the latest releases and chatting with viewers"
    },
    {
      id: 2,
      title: "Special Event Stream",
      date: "Saturday, March 8, 2025",
      time: "3:00 PM - 6:00 PM",
      description: "Join us for a special community event with prizes!"
    }
  ]);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editingItem, setEditingItem] = useState({
    id: 0,
    title: "",
    date: "",
    time: "",
    description: ""
  });
  
  // Copy to clipboard function
  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${type} copied to clipboard.`,
        duration: 2000,
      });
    } catch (err) {
      console.error("Failed to copy:", err);
      toast({
        title: "Copy Failed",
        description: "Please try again or copy manually.",
        variant: "destructive",
      });
    }
  };

  const handleInitializeStream = () => {
    toast({
      title: "Stream Initialized",
      description: "Your stream is ready to go! Copy your stream key and URL.",
      duration: 3000,
    });
  };

  return (
    <div style={{
      backgroundColor: '#0D0D0D',
      minHeight: '100vh',
      color: 'white',
      backgroundImage: 'linear-gradient(to bottom, #1A1A1A, #0D0D0D)',
      overflow: 'auto'
    }}>
      {/* Header with navigation */}
      <div style={{
        background: 'linear-gradient(to right, #FF8A00, #FF5800)',
        padding: '15px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 12px rgba(255, 88, 0, 0.3)'
      }}>
        <div className="flex items-center">
          <h1 className="text-xl font-bold">Stream Setup</h1>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            style={{
              background: 'rgba(0, 0, 0, 0.2)',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              color: 'white'
            }}
          >
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">View Stream</span>
          </Button>
        </div>
      </div>
      
      <div className="container max-w-6xl py-3 px-3 md:px-6 md:py-4 space-y-4 md:space-y-6">
        <Tabs defaultValue="live" className="w-full">
          <div className="flex overflow-x-auto pb-2 -mx-1">
            <div 
              className={`px-4 py-2 mx-1 text-sm font-medium rounded-md cursor-pointer 
                ${activeTab === 'live' ? 
                  'bg-orange-600 text-white' : 
                  'bg-slate-800/50 text-slate-300 hover:bg-slate-700/70'}`}
              onClick={() => setActiveTab('live')}
            >
              Stream Setup
            </div>
            <div 
              className={`px-4 py-2 mx-1 text-sm font-medium rounded-md cursor-pointer 
                ${activeTab === 'schedule' ? 
                  'bg-orange-600 text-white' : 
                  'bg-slate-800/50 text-slate-300 hover:bg-slate-700/70'}`}
              onClick={() => setActiveTab('schedule')}
            >
              Schedule
            </div>
            <div 
              className={`px-4 py-2 mx-1 text-sm font-medium rounded-md cursor-pointer 
                ${activeTab === 'dashboard' ? 
                  'bg-orange-600 text-white' : 
                  'bg-slate-800/50 text-slate-300 hover:bg-slate-700/70'}`}
              onClick={() => setActiveTab('dashboard')}
            >
              Dashboard
            </div>
          </div>

          <div className="mt-6">
            <TabsContent value="live" className="mt-0 space-y-4">
              <Card className="border border-slate-800 overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg md:text-xl">Stream Configuration</CardTitle>
                  <CardDescription className="text-xs md:text-sm">Configure your stream with OBS or other streaming software</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-md font-medium mb-2 text-orange-500 flex items-center gap-2">
                      <Layers className="h-4 w-4 inline" />
                      Stream URL
                    </h3>
                    <div className="flex">
                      <Input 
                        value={RTMP_URL} 
                        readOnly 
                        className="bg-black/30 border-slate-700 text-slate-200"
                      />
                      <Button 
                        onClick={() => copyToClipboard(RTMP_URL, "Stream URL")}
                        className="ml-2 bg-orange-600 hover:bg-orange-700"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-md font-medium mb-2 text-orange-500 flex items-center gap-2">
                      <Settings2 className="h-4 w-4 inline" />
                      Stream Key
                    </h3>
                    <div className="flex">
                      <Input 
                        type={showKey ? "text" : "password"} 
                        value={STREAM_KEY} 
                        readOnly 
                        className="bg-black/30 border-slate-700 text-slate-200"
                      />
                      <Button 
                        onClick={() => setShowKey(!showKey)}
                        className="ml-2 bg-slate-700 hover:bg-slate-600"
                      >
                        {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button 
                        onClick={() => copyToClipboard(STREAM_KEY, "Stream Key")}
                        className="ml-2 bg-orange-600 hover:bg-orange-700"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Never share your stream key with anyone.</p>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-md font-medium mb-3 text-orange-500">Recommended Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-800/30 p-3 rounded-md">
                        <h4 className="text-sm font-medium text-slate-200">Video</h4>
                        <ul className="mt-2 text-xs text-slate-400 space-y-1">
                          <li>Resolution: 1920x1080</li>
                          <li>Framerate: 60 fps</li>
                          <li>Keyframe Interval: 2 seconds</li>
                          <li>Rate Control: CBR</li>
                        </ul>
                      </div>
                      <div className="bg-slate-800/30 p-3 rounded-md">
                        <h4 className="text-sm font-medium text-slate-200">Audio</h4>
                        <ul className="mt-2 text-xs text-slate-400 space-y-1">
                          <li>Bitrate: 160 Kbps</li>
                          <li>Sample Rate: 48 kHz</li>
                          <li>Channels: Stereo</li>
                          <li>Codec: AAC</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <Button 
                    className="w-full bg-orange-600 hover:bg-orange-700 mt-4" 
                    onClick={handleInitializeStream}
                  >
                    <Play className="h-4 w-4 mr-2" /> 
                    Initialize Stream
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="schedule" className="mt-0 space-y-4">
              <Card className="border border-slate-800 overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg md:text-xl">Stream Schedule</CardTitle>
                  <CardDescription className="text-xs md:text-sm">Plan and announce your upcoming streams</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700" 
                    onClick={() => setIsEditing(true)}
                  >
                    <Calendar className="h-4 w-4 mr-2" /> 
                    Schedule New Stream
                  </Button>
                  
                  {scheduleItems.length > 0 ? (
                    <div className="space-y-3 mt-4">
                      {scheduleItems.map((item) => (
                        <div 
                          key={item.id} 
                          className="bg-slate-800/30 p-4 rounded-md border border-slate-700"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium text-white">{item.title}</h3>
                              <p className="text-sm text-orange-400 mt-1">
                                <Calendar className="h-4 w-4 inline mr-1" /> 
                                {item.date}
                              </p>
                              <p className="text-sm text-slate-400 mt-1">
                                <Clock className="h-4 w-4 inline mr-1" /> 
                                {item.time}
                              </p>
                              <p className="text-sm text-slate-300 mt-2">{item.description}</p>
                            </div>
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="h-8 border-slate-600 text-orange-400 hover:text-orange-300 hover:bg-orange-950/30"
                                onClick={() => {
                                  setEditingItem(item);
                                  setIsEditing(true);
                                }}
                              >
                                Edit
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-slate-800/30 p-6 rounded-md text-center text-slate-400 mt-4">
                      <Calendar className="h-10 w-10 mx-auto mb-3 text-slate-500" />
                      <p>No scheduled streams yet.</p>
                      <p className="text-sm mt-1">Create a schedule to let your viewers know when you'll be live.</p>
                    </div>
                  )}
                  
                  {isEditing && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                      <div className="bg-slate-900 p-6 rounded-lg w-full max-w-md">
                        <h3 className="text-lg font-medium mb-4 text-orange-400">
                          {scheduleItems.some(item => item.id === editingItem.id) ? "Edit Stream" : "Schedule New Stream"}
                        </h3>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Stream Title</label>
                            <Input 
                              placeholder="Weekly Gaming Stream" 
                              value={editingItem.title}
                              onChange={(e) => setEditingItem({...editingItem, title: e.target.value})}
                              className="bg-slate-800 border-slate-700"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Date</label>
                            <Input 
                              placeholder="April 30, 2025" 
                              value={editingItem.date}
                              onChange={(e) => setEditingItem({...editingItem, date: e.target.value})}
                              className="bg-slate-800 border-slate-700"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Time</label>
                            <Input 
                              placeholder="7:00 PM - 9:00 PM" 
                              value={editingItem.time}
                              onChange={(e) => setEditingItem({...editingItem, time: e.target.value})}
                              className="bg-slate-800 border-slate-700"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                            <Input 
                              placeholder="Playing the latest releases and chatting with viewers" 
                              value={editingItem.description}
                              onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                              className="bg-slate-800 border-slate-700"
                            />
                          </div>
                        </div>
                        
                        <div className="flex justify-end gap-2 mt-6">
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setIsEditing(false);
                              setEditingItem({id: 0, title: "", date: "", time: "", description: ""});
                            }}
                            className="border-slate-600"
                          >
                            Cancel
                          </Button>
                          
                          <Button 
                            className="bg-orange-600 hover:bg-orange-700"
                            onClick={() => {
                              // Validate form fields
                              if (
                                editingItem.title.trim() !== "" && 
                                editingItem.date.trim() !== "" && 
                                editingItem.time.trim() !== ""
                              ) {
                                // Update existing item
                                if (scheduleItems.some(item => item.id === editingItem.id)) {
                                  setScheduleItems(
                                    scheduleItems.map(item => 
                                      item.id === editingItem.id ? editingItem : item
                                    )
                                  );
                                  toast({
                                    title: "Stream updated",
                                    description: "Your scheduled stream has been updated",
                                  });
                                } 
                                // Add new item
                                else {
                                  setScheduleItems([...scheduleItems, {
                                    ...editingItem,
                                    id: Math.max(0, ...scheduleItems.map(i => i.id)) + 1
                                  }]);
                                  toast({
                                    title: "Stream scheduled",
                                    description: "Your new stream has been scheduled",
                                  });
                                }
                                setIsEditing(false);
                                setEditingItem({id: 0, title: "", date: "", time: "", description: ""});
                              } else {
                                toast({
                                  title: "Incomplete form",
                                  description: "Please fill in all required fields",
                                  variant: "destructive"
                                });
                              }
                            }}
                          >
                            {scheduleItems.some(item => item.id === editingItem.id) ? "Update" : "Schedule"} Stream
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="mt-0 space-y-4">
              <Card className="border border-slate-800 overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg md:text-xl">Stream Dashboard</CardTitle>
                  <CardDescription className="text-xs md:text-sm">Monitor your stream performance and analytics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-orange-950/30 border-orange-600/30">
                      <CardHeader className="pb-2">
                        <CardDescription>Current Viewers</CardDescription>
                        <CardTitle className="text-2xl">0</CardTitle>
                      </CardHeader>
                    </Card>
                    <Card className="bg-purple-950/30 border-purple-600/30">
                      <CardHeader className="pb-2">
                        <CardDescription>Total Views</CardDescription>
                        <CardTitle className="text-2xl">0</CardTitle>
                      </CardHeader>
                    </Card>
                    <Card className="bg-green-950/30 border-green-600/30">
                      <CardHeader className="pb-2">
                        <CardDescription>Chat Messages</CardDescription>
                        <CardTitle className="text-2xl">0</CardTitle>
                      </CardHeader>
                    </Card>
                    <Card className="bg-orange-950/30 border-orange-600/30">
                      <CardHeader className="pb-2">
                        <CardDescription>Stream Duration</CardDescription>
                        <CardTitle className="text-2xl">00:00:00</CardTitle>
                      </CardHeader>
                    </Card>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Stream Analytics</h3>
                    <div className="aspect-video bg-black/30 rounded-md flex items-center justify-center">
                      <p className="text-gray-400">Analytics visualization will appear here during active streams</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <EnhancedGamingDashboard streamId="example-stream" isLoading={false} isActive={false} />
                  
                  <Separator />
                  
                  <ChatModerationDashboard streamId="example-stream" />
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
