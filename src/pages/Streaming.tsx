import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    <div className="container py-4 space-y-6">
      <h1 className="text-3xl font-bold">Streaming</h1>
      
      <Tabs defaultValue="live" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="live">
            <Play className="w-4 h-4 mr-2" />
            Live
          </TabsTrigger>
          <TabsTrigger value="setup">
            <Settings2 className="w-4 h-4 mr-2" />
            Setup
          </TabsTrigger>
          <TabsTrigger value="schedule">
            <Calendar className="w-4 h-4 mr-2" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="dashboard">
            <ChartBar className="w-4 h-4 mr-2" />
            Dashboard
          </TabsTrigger>
        </TabsList>
        
        {/* Live Tab */}
        <TabsContent value="live" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stream Controls</CardTitle>
              <CardDescription>Start your stream and monitor your viewers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium">Stream Status</h3>
                  <p className="text-sm text-gray-400">Offline</p>
                </div>
                <Button onClick={handleInitializeStream} className="bg-purple-600 hover:bg-purple-700">
                  <Play className="mr-2 h-4 w-4" />
                  Initialize Stream
                </Button>
              </div>
              
              <Separator />
              
              <div className="bg-black/20 rounded-md p-5 space-y-5">
                <h3 className="text-lg font-medium mb-3">Stream Quick-Start Guide</h3>
                <ol className="list-decimal ml-5 space-y-2 text-gray-200">
                  <li>Click the <span className="text-purple-400 font-medium">"Setup"</span> tab to view your stream key</li>
                  <li>Copy the RTMP URL and Stream Key</li>
                  <li>Open your streaming software (e.g. OBS Studio)</li>
                  <li>Go to Settings → Stream</li>
                  <li>Select "Custom..." as the service</li>
                  <li>Paste the Stream URL as the "Server"</li>
                  <li>Paste your Stream Key in the "Stream Key" field</li>
                  <li>Click "Apply" and then "OK"</li>
                  <li>Click "Start Streaming" in OBS when ready</li>
                </ol>
              </div>
              
              <div className="mt-4">
                <StreamDashboard />
              </div>
              
              <div className="mt-6">
                <StreamChat />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Setup Tab */}
        <TabsContent value="setup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stream Configuration</CardTitle>
              <CardDescription>Your personal stream settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Two-column layout for URL and Key */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Stream URL Section */}
                <div className="space-y-2">
                  <h3 className="text-md font-medium">Stream URL (Server)</h3>
                  <div className="flex flex-col gap-2">
                    <div className="flex">
                      <Input
                        value={RTMP_URL}
                        readOnly
                        className="font-mono bg-black/20 border-gray-700 rounded-r-none"
                      />
                      <Button
                        onClick={() => copyToClipboard(RTMP_URL, "Stream URL")}
                        className="whitespace-nowrap rounded-l-none"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-400">
                      Enter this as the "Server" in your streaming software.
                    </p>
                  </div>
                </div>
                
                {/* Stream Key Section */}
                <div className="space-y-2">
                  <h3 className="text-md font-medium">Stream Key</h3>
                  <div className="flex flex-col gap-2">
                    <div className="flex">
                      <div className="relative flex-grow">
                        <Input
                          type={showKey ? "text" : "password"}
                          value={STREAM_KEY}
                          readOnly
                          className="font-mono pr-10 bg-black/20 border-gray-700 rounded-r-none"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowKey(!showKey)}
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                        >
                          {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      <Button
                        onClick={() => copyToClipboard(STREAM_KEY, "Stream Key")}
                        className="whitespace-nowrap rounded-l-none"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-400">
                      Enter this as the "Stream Key" in your streaming software. Keep this private.
                    </p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Video Settings */}
              <div>
                <h3 className="text-lg font-medium mb-3">Recommended Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-950/30 rounded-md border border-blue-600/30">
                    <h4 className="font-medium text-blue-400 mb-1">Video</h4>
                    <ul className="text-sm space-y-1">
                      <li>Resolution: 1280x720 (720p) or 1920x1080 (1080p)</li>
                      <li>Framerate: 30 or 60 fps</li>
                      <li>Keyframe Interval: 2 seconds</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-green-950/30 rounded-md border border-green-600/30">
                    <h4 className="font-medium text-green-400 mb-1">Audio</h4>
                    <ul className="text-sm space-y-1">
                      <li>Bitrate: 128-320 Kbps</li>
                      <li>Sample Rate: 44.1 kHz or 48 kHz</li>
                      <li>Channels: Stereo</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              {/* Quick Copy Section */}
              <div className="pt-4">
                <Button 
                  variant="secondary" 
                  size="lg"
                  className="w-full"
                  onClick={() => {
                    copyToClipboard(`OBS STREAM SETTINGS:
Server: ${RTMP_URL}
Stream Key: ${STREAM_KEY}

RECOMMENDED SETTINGS:
- Video: 1280x720 or 1920x1080, 30-60fps
- Bitrate: 2,500-4,000 Kbps
- Keyframe Interval: 2 seconds`, "Complete Streaming Settings");
                  }}
                >
                  <Copy className="mr-2 h-5 w-5" />
                  Copy Complete Streaming Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stream Schedule</CardTitle>
              <CardDescription>Plan and share your upcoming streams</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isEditing ? (
                // Schedule List View
                <>
                  {scheduleItems.length > 0 ? (
                    <div className="space-y-4">
                      {scheduleItems.map((item) => (
                        <div key={item.id} className="border border-gray-700 rounded-md p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-lg font-medium">{item.title}</h3>
                              <div className="flex items-center text-gray-400 mt-1">
                                <Calendar className="h-4 w-4 mr-1" />
                                <span className="text-sm">{item.date}</span>
                              </div>
                              <div className="flex items-center text-gray-400 mt-1">
                                <Clock className="h-4 w-4 mr-1" />
                                <span className="text-sm">{item.time}</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setEditingItem(item);
                                  setIsEditing(true);
                                }}
                              >
                                Edit
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => {
                                  setScheduleItems(scheduleItems.filter(s => s.id !== item.id));
                                  toast({
                                    title: "Stream deleted",
                                    description: "The scheduled stream has been removed",
                                  });
                                }}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                          <p className="mt-2 text-gray-300">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 mx-auto text-gray-500" />
                      <h3 className="mt-2 text-lg font-medium">No Scheduled Streams</h3>
                      <p className="text-gray-400 mt-1">Plan your first stream to let your followers know when you'll be live.</p>
                    </div>
                  )}
                  
                  <Button 
                    className="w-full mt-2"
                    onClick={() => {
                      setEditingItem({
                        id: scheduleItems.length > 0 ? Math.max(...scheduleItems.map(s => s.id)) + 1 : 1,
                        title: "",
                        date: "",
                        time: "",
                        description: ""
                      });
                      setIsEditing(true);
                    }}
                  >
                    Schedule New Stream
                  </Button>
                </>
              ) : (
                // Schedule Edit View
                <div className="space-y-4">
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <label htmlFor="title" className="text-sm font-medium">Stream Title</label>
                      <Input 
                        id="title"
                        placeholder="What are you streaming?"
                        value={editingItem.title}
                        onChange={(e) => setEditingItem({...editingItem, title: e.target.value})}
                      />
                    </div>
                    <div className="grid gap-2">
                      <label htmlFor="date" className="text-sm font-medium">Date</label>
                      <Input 
                        id="date"
                        placeholder="e.g. Monday, March 10, 2025"
                        value={editingItem.date}
                        onChange={(e) => setEditingItem({...editingItem, date: e.target.value})}
                      />
                    </div>
                    <div className="grid gap-2">
                      <label htmlFor="time" className="text-sm font-medium">Time</label>
                      <Input 
                        id="time"
                        placeholder="e.g. 7:00 PM - 9:00 PM"
                        value={editingItem.time}
                        onChange={(e) => setEditingItem({...editingItem, time: e.target.value})}
                      />
                    </div>
                    <div className="grid gap-2">
                      <label htmlFor="description" className="text-sm font-medium">Description</label>
                      <Input 
                        id="description"
                        placeholder="What will you be doing in this stream?"
                        value={editingItem.description}
                        onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsEditing(false);
                        setEditingItem({id: 0, title: "", date: "", time: "", description: ""});
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => {
                        if (editingItem.title && editingItem.date && editingItem.time) {
                          // Update existing item
                          if (scheduleItems.some(item => item.id === editingItem.id)) {
                            setScheduleItems(scheduleItems.map(item => 
                              item.id === editingItem.id ? editingItem : item
                            ));
                            toast({
                              title: "Stream updated",
                              description: "Your scheduled stream has been updated",
                            });
                          } 
                          // Add new item
                          else {
                            setScheduleItems([...scheduleItems, editingItem]);
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
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stream Dashboard</CardTitle>
              <CardDescription>Monitor your stream performance and analytics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-blue-950/30 border-blue-600/30">
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
      </Tabs>
    </div>
  );
}
