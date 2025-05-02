import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
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
  const navigate = useNavigate();
  const location = useLocation();
  const [showKey, setShowKey] = useState(false);
  const [activeTab, setActiveTab] = useState("live");
  
  // Set active tab based on URL path when component mounts
  useEffect(() => {
    if (location.pathname.includes('/streaming/dashboard')) {
      setActiveTab('dashboard');
    } else if (location.pathname.includes('/streaming/schedule')) {
      setActiveTab('schedule');
    } else {
      setActiveTab('live');
    }
  }, [location.pathname]);
  
  // Stream settings
  const RTMP_URL = "rtmp://live.clipt.cc/live";
  const STREAM_KEY = "live_5f9b3a2e1d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a";
  
  // Example schedule data
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
  const copyToClipboard = async (text, type) => {
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
    <div className="streaming-container" style={{
      backgroundColor: '#0D0D0D',
      minHeight: '100vh',
      color: 'white',
      backgroundImage: 'linear-gradient(to bottom, #1A1A1A, #0D0D0D, #0a0a14)',
      overflow: 'auto',
      position: 'relative'
    }}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute h-40 w-40 rounded-full bg-orange-500 opacity-5 blur-3xl -top-10 left-1/4"></div>
        <div className="absolute h-60 w-60 rounded-full bg-purple-500 opacity-5 blur-3xl bottom-20 right-10"></div>
        <div className="absolute h-40 w-40 rounded-full bg-blue-500 opacity-5 blur-3xl bottom-40 left-10"></div>
      </div>
      
      {/* Enhanced Header with centered Stream Setup title */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-50 z-10"></div>
        <div 
          className="absolute inset-0 z-0" 
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1593305841991-05c297ba4575?q=80&w=1000)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(1px)'
          }}
        ></div>
        <div 
          style={{
            background: 'linear-gradient(90deg, rgba(255,85,0,0) 0%, rgba(255,85,0,0.8) 50%, rgba(255,85,0,0) 100%)',
            padding: '30px 20px',
            position: 'relative',
            zIndex: 20,
            boxShadow: '0 4px 20px rgba(255, 88, 0, 0.4)',
            borderBottom: '2px solid rgba(255, 136, 0, 0.5)'
          }}
        >
          <div className="container mx-auto flex flex-col items-center justify-center">
            <div className="flex items-center justify-center mb-2">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse mr-2"></div>
              <h1 className="text-3xl font-bold text-center text-white drop-shadow-lg" style={{textShadow: '0 0 10px rgba(255, 85, 0, 0.7)'}}>
                Stream Setup
              </h1>
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse ml-2"></div>
            </div>
            <p className="text-white text-opacity-90 text-center text-sm mb-3">Configure your livestream settings and get ready to go live</p>
            
            <div className="flex items-center gap-4 mt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 border-none text-white"
              >
                <Play className="h-4 w-4" />
                <span>Start Streaming</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 bg-black bg-opacity-50 hover:bg-opacity-70 border border-orange-500/30"
              >
                <Eye className="h-4 w-4" />
                <span>View Stream</span>
              </Button>
            </div>
          </div>
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
              onClick={() => {
                setActiveTab('schedule');
                // Navigate to streaming/schedule page
                navigate('/streaming/schedule');
              }}
            >
              Schedule
            </div>
            <div 
              className={`px-4 py-2 mx-1 text-sm font-medium rounded-md cursor-pointer 
                ${activeTab === 'dashboard' ? 
                  'bg-orange-600 text-white' : 
                  'bg-slate-800/50 text-slate-300 hover:bg-slate-700/70'}`}
              onClick={() => {
                setActiveTab('dashboard'); 
                // Navigate to streaming/dashboard page
                navigate('/streaming/dashboard');
              }}
            >
              Dashboard
            </div>
          </div>

          <div className="mt-6">
            <TabsContent value="live" className="mt-0 space-y-4">
              <Card className="border border-orange-900/30 bg-gradient-to-br from-black to-slate-900/50 overflow-hidden shadow-xl">
                <CardHeader className="bg-gradient-to-r from-orange-950/30 to-slate-900/30 border-b border-orange-900/20">
                  <CardTitle className="text-orange-400">Stream Configuration</CardTitle>
                  <CardDescription className="text-orange-300/70">Configure your stream with OBS or other streaming software</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div className="bg-black/30 p-4 rounded-lg border border-orange-900/20">
                    <h3 className="text-base font-medium mb-2 text-orange-300 flex items-center">
                      <Layers className="h-4 w-4 mr-2 text-orange-500" />
                      RTMP URL
                    </h3>
                    <div className="flex gap-2">
                      <Input
                        value={RTMP_URL}
                        readOnly
                        className="flex-1 bg-black/40 border-orange-900/30 text-orange-100"
                      />
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => copyToClipboard(RTMP_URL, "RTMP URL")}
                        className="flex-shrink-0 border-orange-500/40 hover:bg-orange-900/30 hover:border-orange-500/60 text-orange-400"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="bg-black/30 p-4 rounded-lg border border-orange-900/20">
                    <h3 className="text-base font-medium mb-2 text-orange-300 flex items-center">
                      <Settings2 className="h-4 w-4 mr-2 text-orange-500" />
                      Stream Key
                    </h3>
                    <div className="flex gap-2">
                      <Input
                        type={showKey ? "text" : "password"}
                        value={STREAM_KEY}
                        readOnly
                        className="flex-1 bg-black/40 border-orange-900/30 text-orange-100"
                      />
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => setShowKey(!showKey)}
                        className="flex-shrink-0 border-orange-500/40 hover:bg-orange-900/30 hover:border-orange-500/60 text-orange-400"
                      >
                        {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => copyToClipboard(STREAM_KEY, "Stream Key")}
                        className="flex-shrink-0 border-orange-500/40 hover:bg-orange-900/30 hover:border-orange-500/60 text-orange-400"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Never share your stream key with anyone.</p>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-medium text-orange-400 mb-3">Recommended Settings</h3>
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

                  <div className="flex flex-col sm:flex-row gap-4 pt-2">
                    <Button 
                      variant="default" 
                      className="w-full sm:w-auto bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 border-none shadow-md shadow-orange-900/30 text-white"
                      onClick={handleInitializeStream}
                    >
                      Initialize Stream
                    </Button>
                    <Select defaultValue="720p">
                      <SelectTrigger className="w-full sm:w-auto bg-black/40 border-orange-900/30 text-orange-100">
                        <SelectValue placeholder="Quality" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-orange-900/30">
                        <SelectItem value="1080p" className="text-orange-100 hover:bg-orange-900/30">1080p (High)</SelectItem>
                        <SelectItem value="720p" className="text-orange-100 hover:bg-orange-900/30">720p (Medium)</SelectItem>
                        <SelectItem value="480p" className="text-orange-100 hover:bg-orange-900/30">480p (Low)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="schedule" className="mt-0 space-y-4">
              <Card className="border border-orange-900/30 bg-gradient-to-br from-black to-slate-900/50 overflow-hidden shadow-xl">
                <CardHeader className="bg-gradient-to-r from-orange-950/30 to-slate-900/30 border-b border-orange-900/20">
                  <CardTitle className="text-orange-400">Stream Schedule</CardTitle>
                  <CardDescription className="text-orange-300/70">Plan and announce your upcoming streams</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <Button 
                    className="w-full sm:w-auto bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 border-none shadow-md shadow-orange-900/30 text-white"
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
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="dashboard" className="mt-0 space-y-4">
              <Card className="border border-orange-900/30 bg-gradient-to-br from-black to-slate-900/50 overflow-hidden shadow-xl">
                <CardHeader className="bg-gradient-to-r from-orange-950/30 to-slate-900/30 border-b border-orange-900/20">
                  <CardTitle className="text-orange-400">Stream Dashboard</CardTitle>
                  <CardDescription className="text-orange-300/70">Monitor your stream performance and analytics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
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
                    <h3 className="text-lg font-medium text-orange-400">Stream Analytics</h3>
                    <div className="aspect-video bg-black/30 rounded-md flex items-center justify-center">
                      <p className="text-gray-400">Analytics visualization will appear here during active streams</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
