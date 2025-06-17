import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Eye, EyeOff, Server, Check, Video, BarChart, Share2, Shield, Zap, Settings, ChevronLeft, 
  Users, Tv, MessageCircle, Star, GiftIcon, AlertTriangle, Rocket, Activity, Smartphone, ArrowUp, 
  TrendingUp, Radio, Globe, Menu, Play, Pause, Mic, MicOff, Camera, PanelLeft, MessageSquareOff } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "react-qr-code";

// CSS for cosmic animations and effects
const cosmicStyles = `
  @keyframes floatAnimation {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
    100% { transform: translateY(0px); }
  }
  
  @keyframes pulseGlow {
    0% { box-shadow: 0 0 5px rgba(138, 43, 226, 0.4); }
    50% { box-shadow: 0 0 15px rgba(138, 43, 226, 0.7); }
    100% { box-shadow: 0 0 5px rgba(138, 43, 226, 0.4); }
  }
  
  @keyframes starTwinkle {
    0% { opacity: 0.2; }
    50% { opacity: 0.8; }
    100% { opacity: 0.2; }
  }
  
  @keyframes cosmicPulse {
    0% { transform: scale(1); opacity: 0.7; }
    50% { transform: scale(1.05); opacity: 0.9; }
    100% { transform: scale(1); opacity: 0.7; }
  }
  
  @keyframes nebulaDrift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  
  @keyframes cometTrail {
    0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); opacity: 0; }
    30% { opacity: 0.7; }
    70% { opacity: 0.5; }
    100% { transform: translateX(200%) translateY(200%) rotate(45deg); opacity: 0; }
  }
  
  .cosmic-float {
    animation: floatAnimation 6s infinite ease-in-out;
  }
  
  .cosmic-pulse {
    animation: pulseGlow 3s infinite ease-in-out;
  }
  
  .cosmic-star {
    position: absolute;
    background-color: white;
    border-radius: 50%;
    width: 2px;
    height: 2px;
    animation: starTwinkle var(--twinkle-duration, 4s) infinite ease-in-out;
    animation-delay: var(--twinkle-delay, 0s);
    opacity: var(--star-opacity, 0.7);
  }
  
  .cosmic-button {
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
    background: linear-gradient(135deg, rgba(128, 0, 128, 0.8), rgba(75, 0, 130, 0.8));
  }
  
  .cosmic-button::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: all 0.6s ease;
  }
  
  .cosmic-button:hover::before {
    left: 100%;
  }
  
  .cosmic-comet {
    position: absolute;
    width: 50px;
    height: 1px;
    background: linear-gradient(90deg, transparent, #fff, #fff, transparent);
    opacity: 0;
    animation: cometTrail 6s infinite ease-out;
    animation-delay: var(--comet-delay, 0s);
    box-shadow: 0 0 10px 1px rgba(255, 255, 255, 0.5);
    pointer-events: none;
  }
  
  .nebula-bg {
    background: linear-gradient(135deg, rgba(25, 25, 50, 0), rgba(60, 10, 80, 0.2), rgba(15, 15, 35, 0));
    background-size: 400% 400%;
    animation: nebulaDrift 15s infinite ease-in-out;
    position: absolute;
    inset: 0;
    z-index: -1;
  }
`;

// Main Streaming Page Component
const StreamingPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("live");
  const [showChatViewer, setShowChatViewer] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showStreamManager, setShowStreamManager] = useState(false);
  const [showStreamSetup, setShowStreamSetup] = useState(false);
  const [showMobileStreamSetup, setShowMobileStreamSetup] = useState(false);
  const [showPreStreamSetup, setShowPreStreamSetup] = useState(false);
  const [streamPlatform, setStreamPlatform] = useState<'desktop'|'mobile'>('desktop');
  const [isLive, setIsLive] = useState(false);
  const [streamDuration, setStreamDuration] = useState(0);
  const [viewerCount, setViewerCount] = useState(0);
  const [chatCount, setChatCount] = useState(0);
  const [streamLayout, setStreamLayout] = useState("default");
  const [isChatEnabled, setIsChatEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [streamTitle, setStreamTitle] = useState("");
  const [streamCategory, setStreamCategory] = useState("gaming");
  const [streamGame, setStreamGame] = useState("");
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [isMicEnabled, setIsMicEnabled] = useState(true);

  // Function to open pre-stream setup before going live
  const openPreStreamSetup = (platform: 'desktop' | 'mobile') => {
    setStreamPlatform(platform);
    setShowPreStreamSetup(true);
  };

  // Function to toggle mobile streaming setup dialog
  const toggleMobileStreamSetup = () => {
    setShowMobileStreamSetup(!showMobileStreamSetup);
  };

  // Function to toggle chat viewer modal with enhanced reliability
  const toggleChatViewer = () => {
    setShowChatViewer(!showChatViewer);
  };

  // Function to toggle stream manager visibility
  const toggleStreamManager = () => {
    setShowStreamManager(!showStreamManager);
  };

  // Already defined above

  // Toggle stream setup dialog
  const toggleStreamSetup = () => {
    setShowStreamSetup(!showStreamSetup);
  };

  // Function to start stream after pre-stream setup
  const startStream = () => {
    if (!streamTitle.trim()) {
      toast.error("Please enter a stream title");
      return;
    }
    
    setIsLive(true);
    setShowPreStreamSetup(false);
    toast.success(`You're now live with '${streamTitle}'!`);
    
    // Simulate increasing viewers/chat
    setViewerCount(5);
    setChatCount(2);
  };

  // Function to start stream from mobile
  const startMobileStream = () => {
    if (!streamTitle.trim()) {
      toast.error("Please enter a stream title");
      return;
    }
    
    setIsLive(true);
    setShowMobileStreamSetup(false);
    setShowPreStreamSetup(false);
    toast.success("Mobile stream started!");
    
    // Simulate increasing viewers/chat
    setViewerCount(3);
    setChatCount(1);
  };

  // Change stream layout mode
  const changeStreamLayout = (layout: string) => {
    setStreamLayout(layout);
    toast.success(`Stream layout changed to ${layout}`);
  };
  
  // Function to copy to clipboard
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast.success(`${type} copied to clipboard`);
      },
      (err) => {
        toast.error(`Could not copy ${type.toLowerCase()}: ${err}`);
      }
    );
  };
  
  // Function to toggle live status
  const toggleLiveStatus = () => {
    if (isLive) {
      setIsLive(false);
      setStreamDuration(0);
      setViewerCount(0);
      setChatCount(0);
      toast.success("Stream ended");
    } else {
      // Show pre-stream setup before going live
      openPreStreamSetup('desktop');
    }
  };
  
  // Effect to increment stream duration and random viewer counts while live
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isLive) {
      interval = setInterval(() => {
        setStreamDuration(prev => prev + 1);
        
        // Randomly increase viewer counts for demo purposes
        if (Math.random() > 0.7) {
          setViewerCount(prev => prev + Math.floor(Math.random() * 3));
        }
        
        // Randomly increase chat message counts for demo
        if (Math.random() > 0.6) {
          setChatCount(prev => prev + Math.floor(Math.random() * 2));
        }
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLive]);
  
  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="cosmic-streaming-page" style={{ 
      position: 'relative',
      minHeight: '100vh',
      overflow: 'hidden',
      backgroundColor: '#050314',
      color: 'white',
      padding: '1rem'
    }}>
      {/* Inject cosmic styles */}
      <style>{cosmicStyles}</style>
      
      {/* Starfield background */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}>
        {Array.from({ length: 100 }).map((_, i) => (
          <div 
            key={i}
            className="cosmic-star"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 2 + 1}px`,
              height: `${Math.random() * 2 + 1}px`,
              ['--twinkle-duration' as any]: `${Math.random() * 3 + 2}s`,
              ['--twinkle-delay' as any]: `${Math.random() * 2}s`,
              ['--star-opacity' as any]: Math.random() * 0.5 + 0.3
            }}
          />
        ))}
      </div>
      
      {/* Nebula overlay */}
      <div className="nebula-bg"></div>
      
      {/* Comet animations */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div 
          key={i}
          className="cosmic-comet"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            transform: `rotate(${Math.random() * 180}deg)`,
            ['--comet-delay' as any]: `${i * 2 + Math.random() * 5}s`
          }}
        />
      ))}
      
      {/* Header */}
      <div className="flex justify-center items-center mb-4 relative z-10 w-full">
        <h1 className="text-2xl font-bold cosmic-pulse">Streaming Studio</h1>
      </div>
      
      {/* Main content area */}
      <div className="space-y-6 relative z-10">
        {/* Stream Preview Card */}
        <Card className="cosmic-pulse" style={{ background: 'rgba(20, 10, 40, 0.7)', borderColor: 'rgba(138, 43, 226, 0.4)' }}>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <div>Live Stream Preview</div>
              <Badge variant={isLive ? "default" : "outline"} className={`${isLive ? 'bg-red-500' : ''}`}>
                {isLive ? 'LIVE' : 'OFFLINE'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center mb-4 relative overflow-hidden">
              {isLive ? (
                <>
                  <div className="absolute top-2 right-2 flex items-center space-x-2">
                    <Badge variant="outline" className="bg-black/50">
                      <Eye className="w-3 h-3 mr-1" /> {viewerCount}
                    </Badge>
                    <Badge variant="outline" className="bg-black/50">
                      {formatTime(streamDuration)}
                    </Badge>
                  </div>
                  <div className="text-center cosmic-float">
                    <div className="text-sm text-gray-400 mb-1">Your stream is live</div>
                    <div className="flex space-x-2 justify-center">
                      <Button variant="outline" size="sm" onClick={() => setIsChatEnabled(!isChatEnabled)}>
                        {isChatEnabled ? <MessageCircle className="w-4 h-4" /> : <MessageCircle className="w-4 h-4 text-gray-500" />}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setIsAudioEnabled(!isAudioEnabled)}>
                        {isAudioEnabled ? <Radio className="w-4 h-4" /> : <Radio className="w-4 h-4 text-gray-500" />}
                      </Button>
                      <Button variant="outline" size="sm" onClick={toggleStreamManager}>
                        <BarChart className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <p className="text-gray-400 mb-4">Start your stream to see preview</p>
                  <Button 
                    onClick={toggleLiveStatus} 
                    className="cosmic-button"
                    style={{ background: 'linear-gradient(135deg, rgba(138, 43, 226, 0.8), rgba(75, 0, 130, 0.8))' }}
                  >
                    <Play className="w-4 h-4 mr-2" /> Go Live
                  </Button>
                </div>
              )}
            </div>
            
            {/* Stream Controls Row */}
            <div className="flex flex-wrap gap-2 justify-between items-center">
              <div>
                <Button 
                  variant={isLive ? "destructive" : "default"}
                  onClick={toggleLiveStatus}
                  className="cosmic-button"
                >
                  {isLive ? <>
                    <Pause className="w-4 h-4 mr-2" /> End Stream
                  </> : <>
                    <Play className="w-4 h-4 mr-2" /> Go Live
                  </>}
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={toggleChatViewer}>
                  <MessageCircle className="w-4 h-4 mr-1" /> Chat
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="cosmic-pulse border-purple-500/30" 
                  onClick={() => {
                    if (isLive) {
                      setShowAnalytics(true);
                    } else {
                      toast("Analytics are available when you're live", {
                        description: "Start streaming to see your analytics",
                        icon: <BarChart className="w-4 h-4" />
                      });
                    }
                  }}
                >
                  <BarChart className="w-4 h-4 mr-1" /> Analytics
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="cosmic-pulse border-orange-500/30" 
                  onClick={toggleMobileStreamSetup}
                >
                  <Smartphone className="w-4 h-4 mr-1" /> Mobile Stream
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t border-purple-900/30 pt-4">
            <div className="text-xs text-gray-400">
              {isLive ? `Live for ${formatTime(streamDuration)}` : 'Stream offline'}
            </div>
            <div className="text-xs text-gray-400">
              {isLive ? `${viewerCount} viewers` : 'No viewers'}
            </div>
          </CardFooter>
        </Card>
        
        {/* Enhanced Streamer Analytics Section */}
        {isLive && (
          <>
            <h2 id="streamer-analytics" className="text-xl font-bold mb-3 mt-6 flex items-center">
              <BarChart className="w-5 h-5 mr-2" /> Streamer Analytics
            </h2>
            
            {/* Primary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <Card className="cosmic-float" style={{ background: 'rgba(20, 10, 40, 0.7)', borderColor: 'rgba(138, 43, 226, 0.4)', animationDelay: '0.1s' }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center">
                    <Users className="w-4 h-4 mr-2" /> Live Viewers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{viewerCount}</div>
                  <div className="flex items-center text-xs text-green-400 mt-1">
                    <ArrowUp className="w-3 h-3 mr-1" /> +{Math.floor(viewerCount * 0.12)} since start
                  </div>
                  <Progress value={Math.min((viewerCount / 100) * 100, 100)} className="mt-2 bg-purple-900/20" />
                </CardContent>
              </Card>
              
              <Card className="cosmic-float" style={{ background: 'rgba(20, 10, 40, 0.7)', borderColor: 'rgba(138, 43, 226, 0.4)', animationDelay: '0.2s' }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center">
                    <MessageCircle className="w-4 h-4 mr-2" /> Chat Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{chatCount}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {Math.round(chatCount / Math.max(streamDuration / 60, 1))} msgs/min
                  </div>
                  <Progress value={Math.min((chatCount / 50) * 100, 100)} className="mt-2 bg-purple-900/20" />
                </CardContent>
              </Card>
              
              <Card className="cosmic-float" style={{ background: 'rgba(20, 10, 40, 0.7)', borderColor: 'rgba(138, 43, 226, 0.4)', animationDelay: '0.3s' }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center">
                    <Star className="w-4 h-4 mr-2" /> Subscriptions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Math.floor(viewerCount * 0.15)}</div>
                  <div className="flex items-center text-xs text-green-400 mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" /> +3 today
                  </div>
                  <Progress value={Math.min((viewerCount * 0.15 / 20) * 100, 100)} className="mt-2 bg-purple-900/20" />
                </CardContent>
              </Card>
              
              <Card className="cosmic-float" style={{ background: 'rgba(20, 10, 40, 0.7)', borderColor: 'rgba(138, 43, 226, 0.4)', animationDelay: '0.4s' }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center">
                    <Activity className="w-4 h-4 mr-2" /> Stream Health
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Excellent</div>
                  <div className="text-xs text-gray-400 mt-1">
                    1080p @ 60fps
                  </div>
                  <Progress value={95} className="mt-2 bg-purple-900/20" />
                </CardContent>
              </Card>
            </div>
            
            {/* Advanced Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card style={{ background: 'rgba(20, 10, 40, 0.7)', borderColor: 'rgba(138, 43, 226, 0.4)' }}>
                <CardHeader>
                  <CardTitle className="text-sm">Audience Demographics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Age Groups</span>
                        <span>Distribution</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs w-20">18-24</span>
                        <div className="flex-1 mx-2">
                          <Progress value={45} className="h-2 bg-purple-900/20" />
                        </div>
                        <span className="text-xs">45%</span>
                      </div>
                      <div className="flex items-center mt-1">
                        <span className="text-xs w-20">25-34</span>
                        <div className="flex-1 mx-2">
                          <Progress value={30} className="h-2 bg-purple-900/20" />
                        </div>
                        <span className="text-xs">30%</span>
                      </div>
                      <div className="flex items-center mt-1">
                        <span className="text-xs w-20">35-44</span>
                        <div className="flex-1 mx-2">
                          <Progress value={15} className="h-2 bg-purple-900/20" />
                        </div>
                        <span className="text-xs">15%</span>
                      </div>
                      <div className="flex items-center mt-1">
                        <span className="text-xs w-20">45+</span>
                        <div className="flex-1 mx-2">
                          <Progress value={10} className="h-2 bg-purple-900/20" />
                        </div>
                        <span className="text-xs">10%</span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Top Locations</span>
                        <span>Viewers</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <Globe className="w-3 h-3 mr-2" /> 
                          <span className="text-xs">United States</span>
                        </div>
                        <Badge variant="outline" className="bg-black/20">{Math.floor(viewerCount * 0.4)}</Badge>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <div className="flex items-center">
                          <Globe className="w-3 h-3 mr-2" /> 
                          <span className="text-xs">United Kingdom</span>
                        </div>
                        <Badge variant="outline" className="bg-black/20">{Math.floor(viewerCount * 0.2)}</Badge>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <div className="flex items-center">
                          <Globe className="w-3 h-3 mr-2" /> 
                          <span className="text-xs">Canada</span>
                        </div>
                        <Badge variant="outline" className="bg-black/20">{Math.floor(viewerCount * 0.15)}</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card style={{ background: 'rgba(20, 10, 40, 0.7)', borderColor: 'rgba(138, 43, 226, 0.4)' }}>
                <CardHeader>
                  <CardTitle className="text-sm">Revenue & Engagement</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <GiftIcon className="w-4 h-4 mr-2 text-purple-400" />
                        <span className="text-sm">Donations</span>
                      </div>
                      <div className="text-xl font-bold">${(viewerCount * 0.3).toFixed(2)}</div>
                      <div className="text-xs text-green-400 flex items-center">
                        <TrendingUp className="w-3 h-3 mr-1" /> +12% from last stream
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <Zap className="w-4 h-4 mr-2 text-yellow-400" />
                        <span className="text-sm">Bits/Tips</span>
                      </div>
                      <div className="text-xl font-bold">{viewerCount * 25}</div>
                      <div className="text-xs text-green-400 flex items-center">
                        <TrendingUp className="w-3 h-3 mr-1" /> +8% from last stream
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-medium mb-1">Top Supporters</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center bg-purple-900/20 p-1.5 rounded">
                        <div className="flex items-center">
                          <Shield className="w-3 h-3 mr-2 text-yellow-400" />
                          <span className="text-xs font-medium">CosmicVoyager</span>
                        </div>
                        <Badge variant="outline" className="text-xs bg-black/20">${(viewerCount * 0.05).toFixed(2)}</Badge>
                      </div>
                      <div className="flex justify-between items-center bg-purple-900/10 p-1.5 rounded">
                        <div className="flex items-center">
                          <Shield className="w-3 h-3 mr-2 text-purple-400" />
                          <span className="text-xs font-medium">StarGazer92</span>
                        </div>
                        <Badge variant="outline" className="text-xs bg-black/20">${(viewerCount * 0.03).toFixed(2)}</Badge>
                      </div>
                      <div className="flex justify-between items-center bg-purple-900/10 p-1.5 rounded">
                        <div className="flex items-center">
                          <Shield className="w-3 h-3 mr-2 text-blue-400" />
                          <span className="text-xs font-medium">NebulaExplorer</span>
                        </div>
                        <Badge variant="outline" className="text-xs bg-black/20">${(viewerCount * 0.02).toFixed(2)}</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
        
        {/* Stream Details Card */}
        <Card style={{ background: 'rgba(20, 10, 40, 0.7)', borderColor: 'rgba(138, 43, 226, 0.4)' }}>
          <CardHeader>
            <CardTitle>Stream Settings</CardTitle>
            <CardDescription>Configure your stream details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Stream Key</h3>
              <div className="flex">
                <Input 
                  type="password" 
                  value="rtmp-stream-key-xxxxx-xxxxxx" 
                  readOnly 
                  className="flex-1 bg-gray-800" 
                />
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="ml-2" 
                  onClick={() => copyToClipboard("rtmp-stream-key-xxxxx-xxxxxx", "Stream key")}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">Stream URL</h3>
              <div className="flex">
                <Input 
                  value="rtmp://stream.clipt.com/live" 
                  readOnly 
                  className="flex-1 bg-gray-800" 
                />
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="ml-2" 
                  onClick={() => copyToClipboard("rtmp://stream.clipt.com/live", "Stream URL")}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Stream Manager Dialog */}
      <Dialog open={showStreamManager} onOpenChange={setShowStreamManager}>
        <DialogContent className="sm:max-w-[600px]" style={{ background: 'rgba(20, 10, 40, 0.95)', backdropFilter: 'blur(10px)', border: '1px solid rgba(138, 43, 226, 0.4)' }}>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Server className="w-5 h-5 mr-2" /> Stream Manager
            </DialogTitle>
            <DialogDescription>
              Control your stream settings and view analytics
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="chat" className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="chat">Live Chat</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="chat" className="space-y-4">
              <div className="bg-gray-900 rounded-md h-60 p-4 overflow-y-auto">
                <div className="space-y-3">
                  <div className="flex items-start">
                    <Badge className="mt-1 mr-2">Mod</Badge>
                    <div>
                      <span className="font-bold text-purple-400">CosmicMod: </span>
                      <span>Welcome to the stream! Remember to follow the chat rules.</span>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div>
                      <span className="font-bold text-blue-400">StarGazer92: </span>
                      <span>Hey everyone! Excited for today's stream!</span>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div>
                      <span className="font-bold text-green-400">CosmicVoyager: </span>
                      <span>The graphics look amazing today!</span>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Badge variant="outline" className="mt-1 mr-2 bg-purple-900/30">Sub</Badge>
                    <div>
                      <span className="font-bold text-yellow-400">NebulaExplorer: </span>
                      <span>Just subscribed! Let's go!</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex">
                <Input 
                  placeholder="Type a message..." 
                  className="flex-1 bg-gray-800" 
                />
                <Button variant="default" className="ml-2 cosmic-button">
                  Send
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card style={{ background: 'rgba(30, 15, 50, 0.5)' }}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Peak Viewers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{viewerCount + 2}</div>
                    <div className="text-xs text-green-400 flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1" /> +5% from last stream
                    </div>
                  </CardContent>
                </Card>
                
                <Card style={{ background: 'rgba(30, 15, 50, 0.5)' }}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Chat Messages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{chatCount}</div>
                    <div className="text-xs text-green-400 flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1" /> +12% from last stream
                    </div>
                  </CardContent>
                </Card>
                
                <Card style={{ background: 'rgba(30, 15, 50, 0.5)' }}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Uptime</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatTime(streamDuration)}</div>
                  </CardContent>
                </Card>
                
                <Card style={{ background: 'rgba(30, 15, 50, 0.5)' }}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Stream Health</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                      <div className="text-lg font-medium">Excellent</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="settings" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Stream Title</h3>
                  <Input 
                    value={streamTitle || "Cosmic Adventure Stream"} 
                    onChange={(e) => setStreamTitle(e.target.value)}
                    className="bg-gray-800" 
                  />
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Category</h3>
                  <Select value={streamCategory} onValueChange={setStreamCategory}>
                    <SelectTrigger className="bg-gray-800">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gaming">Gaming</SelectItem>
                      <SelectItem value="irl">IRL</SelectItem>
                      <SelectItem value="music">Music</SelectItem>
                      <SelectItem value="esports">Esports</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Game</h3>
                  <Input 
                    value={streamGame} 
                    onChange={(e) => setStreamGame(e.target.value)}
                    placeholder="Enter game name"
                    className="bg-gray-800" 
                  />
                </div>
                
                <Separator className="my-4" />
                
                <div className="flex justify-between">
                  <h3 className="text-sm font-medium">Camera</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsCameraEnabled(!isCameraEnabled)}
                  >
                    {isCameraEnabled ? <Camera className="w-4 h-4" /> : <Camera className="w-4 h-4 text-gray-500" />}
                  </Button>
                </div>
                
                <div className="flex justify-between">
                  <h3 className="text-sm font-medium">Microphone</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsMicEnabled(!isMicEnabled)}
                  >
                    {isMicEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStreamManager(false)}>
              Close
            </Button>
            
            <Button className="cosmic-button">
              <Check className="w-4 h-4 mr-2" /> Apply Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Mobile Stream Setup Dialog */}
      <Dialog open={showStreamSetup} onOpenChange={setShowStreamSetup}>
        <DialogContent style={{ background: 'rgba(20, 10, 40, 0.95)', backdropFilter: 'blur(10px)', border: '1px solid rgba(138, 43, 226, 0.4)' }}>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Smartphone className="w-5 h-5 mr-2" /> Stream Setup
            </DialogTitle>
            <DialogDescription>
              Configure your stream before going live
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Stream Title</label>
              <Input 
                value={streamTitle} 
                onChange={(e) => setStreamTitle(e.target.value)}
                placeholder="Enter stream title"
                className="bg-gray-800" 
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Category</label>
              <Select value={streamCategory} onValueChange={setStreamCategory}>
                <SelectTrigger className="bg-gray-800">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gaming">Gaming</SelectItem>
                  <SelectItem value="irl">IRL</SelectItem>
                  <SelectItem value="music">Music</SelectItem>
                  <SelectItem value="esports">Esports</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Game</label>
              <Input 
                value={streamGame} 
                onChange={(e) => setStreamGame(e.target.value)}
                placeholder="Enter game name (optional)"
                className="bg-gray-800" 
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="mr-2" 
                  onClick={() => setIsCameraEnabled(!isCameraEnabled)}
                >
                  {isCameraEnabled ? <Camera className="w-4 h-4" /> : <Camera className="w-4 h-4 text-gray-500" />}
                </Button>
                <div className="text-sm">Camera</div>
              </div>
              
              <div className="flex items-center">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="mr-2" 
                  onClick={() => setIsMicEnabled(!isMicEnabled)}
                >
                  {isMicEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </Button>
                <div className="text-sm">Microphone</div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStreamSetup(false)}>
              Cancel
            </Button>
            <Button className="cosmic-button" onClick={startMobileStream}>
              <Rocket className="w-4 h-4 mr-2" /> Start Stream
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Chat Viewer Popup */}
      <Dialog open={showChatViewer} onOpenChange={setShowChatViewer}>
        <DialogContent className="sm:max-w-[400px]" style={{ background: 'rgba(20, 10, 40, 0.95)', backdropFilter: 'blur(10px)', border: '1px solid rgba(138, 43, 226, 0.4)' }}>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <MessageCircle className="w-5 h-5 mr-2" /> Live Chat
            </DialogTitle>
          </DialogHeader>
          
          <div className="bg-gray-900/60 rounded-md h-96 p-4 overflow-y-auto">
            <CosmicChatViewer isLive={isLive} chatCount={chatCount} />
          </div>
          
          <div className="flex">
            <Input placeholder="Send a message..." className="flex-1 bg-gray-800" />
            <Button variant="default" className="ml-2 cosmic-button">
              Send
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Mobile Stream Setup Dialog */}
      <Dialog open={showMobileStreamSetup} onOpenChange={setShowMobileStreamSetup}>
        <DialogContent className="sm:max-w-[500px]" style={{ background: 'rgba(20, 10, 40, 0.95)', backdropFilter: 'blur(10px)', border: '1px solid rgba(138, 43, 226, 0.4)' }}>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Smartphone className="w-5 h-5 mr-2" /> Mobile Stream Setup
            </DialogTitle>
            <DialogDescription>
              Configure your mobile device for streaming
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="cosmic-card p-4 border border-purple-500/20 rounded-lg bg-gradient-to-br from-gray-900/80 to-gray-800/80">
              <h3 className="text-md font-bold mb-3">Connect Your Mobile Device</h3>
              
              <div className="grid gap-3">
                <div className="flex justify-center">
                  <div className="rounded-lg bg-black/50 p-4 w-48 h-48 flex items-center justify-center border border-purple-500/30">
                    <div className="text-center">
                      <QRCode value="https://clipt.app/mobile-stream" size={120} className="mb-2" />
                      <p className="text-xs text-gray-400">Scan with your phone</p>
                    </div>
                  </div>
                </div>
                
                <div className="text-center text-sm">or</div>
                
                <div className="grid gap-2">
                  <Input 
                    readOnly 
                    value="https://clipt.app/mobile/stream/X8dGhJ2" 
                    className="font-mono text-sm bg-gray-800 border-purple-500/20"
                  />
                  <Button variant="secondary" size="sm" onClick={() => {
                    navigator.clipboard.writeText("https://clipt.app/mobile/stream/X8dGhJ2");
                    toast.success("Link copied to clipboard");
                  }}>
                    <Copy className="w-4 h-4 mr-1" /> Copy Link
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="cosmic-card p-4 border border-purple-500/20 rounded-lg bg-gradient-to-br from-gray-900/80 to-gray-800/80">
              <h3 className="text-md font-bold mb-2">Mobile Stream Settings</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Video Quality</span>
                  <Select defaultValue="720p">
                    <SelectTrigger className="w-28 bg-gray-800 border-purple-500/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1080p">1080p</SelectItem>
                      <SelectItem value="720p">720p</SelectItem>
                      <SelectItem value="480p">480p</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>Orientation</span>
                  <Select defaultValue="portrait">
                    <SelectTrigger className="w-28 bg-gray-800 border-purple-500/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="portrait">Portrait</SelectItem>
                      <SelectItem value="landscape">Landscape</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="sm:justify-between">
            <Button variant="ghost" onClick={() => setShowMobileStreamSetup(false)}>
              Cancel
            </Button>
            <Button 
              variant="default" 
              className="cosmic-button" 
              onClick={() => {
                setShowMobileStreamSetup(false);
                openPreStreamSetup('mobile');
              }}
            >
              <Smartphone className="w-4 h-4 mr-1" /> Continue to Setup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Pre-Stream Setup Dialog */}
      <Dialog open={showPreStreamSetup} onOpenChange={setShowPreStreamSetup}>
        <DialogContent className="sm:max-w-[650px]" style={{ background: 'rgba(20, 10, 40, 0.95)', backdropFilter: 'blur(10px)', border: '1px solid rgba(138, 43, 226, 0.4)' }}>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2" /> Stream Setup
            </DialogTitle>
            <DialogDescription>
              Configure your stream before going live
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-5 py-2">
            <div className="cosmic-card p-4 border border-purple-500/20 rounded-lg bg-gradient-to-br from-gray-900/80 to-gray-800/80">
              <h3 className="text-md font-bold mb-4">Stream Information</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Title</label>
                  <Input 
                    placeholder="My Awesome Stream" 
                    value={streamTitle} 
                    onChange={(e) => setStreamTitle(e.target.value)}
                    className="bg-gray-800 border-purple-500/20"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Category</label>
                    <Select value={streamCategory} onValueChange={setStreamCategory}>
                      <SelectTrigger className="bg-gray-800 border-purple-500/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gaming">Gaming</SelectItem>
                        <SelectItem value="irl">IRL</SelectItem>
                        <SelectItem value="music">Music</SelectItem>
                        <SelectItem value="art">Art</SelectItem>
                        <SelectItem value="chatting">Just Chatting</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-1 block">Game/Topic</label>
                    <Input 
                      placeholder="Enter game or topic" 
                      value={streamGame} 
                      onChange={(e) => setStreamGame(e.target.value)}
                      className="bg-gray-800 border-purple-500/20"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="cosmic-card p-4 border border-purple-500/20 rounded-lg bg-gradient-to-br from-gray-900/80 to-gray-800/80">
              <h3 className="text-md font-bold mb-4">Stream Settings</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Privacy</h4>
                  <Select defaultValue="public">
                    <SelectTrigger className="bg-gray-800 border-purple-500/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="followers">Followers Only</SelectItem>
                      <SelectItem value="subscribers">Subscribers Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Chat Mode</h4>
                  <Select defaultValue="all">
                    <SelectTrigger className="bg-gray-800 border-purple-500/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Everyone</SelectItem>
                      <SelectItem value="followers">Followers</SelectItem>
                      <SelectItem value="subscribers">Subscribers</SelectItem>
                      <SelectItem value="emote">Emote Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center justify-between px-3 py-2 border border-purple-500/10 rounded bg-gray-800/50">
                  <div className="flex items-center">
                    <MessageCircle className="w-4 h-4 mr-2 text-gray-400" />
                    <span>Chat</span>
                  </div>
                  <Button 
                    variant={isChatEnabled ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setIsChatEnabled(!isChatEnabled)}
                    className={isChatEnabled ? "cosmic-pulse" : ""}
                  >
                    {isChatEnabled ? "Enabled" : "Disabled"}
                  </Button>
                </div>
                
                <div className="flex items-center justify-between px-3 py-2 border border-purple-500/10 rounded bg-gray-800/50">
                  <div className="flex items-center">
                    <Mic className="w-4 h-4 mr-2 text-gray-400" />
                    <span>Stream Audio</span>
                  </div>
                  <Button 
                    variant={isAudioEnabled ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                    className={isAudioEnabled ? "cosmic-pulse" : ""}
                  >
                    {isAudioEnabled ? "Enabled" : "Disabled"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="sm:justify-between">
            <Button variant="ghost" onClick={() => setShowPreStreamSetup(false)}>
              Cancel
            </Button>
            <Button 
              variant="default" 
              className="cosmic-button" 
              onClick={startStream}
              disabled={!streamTitle.trim()}
            >
              <Play className="w-4 h-4 mr-1" /> Go Live
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Streamer Analytics Dialog */}
      <Dialog open={showAnalytics} onOpenChange={setShowAnalytics}>
        <DialogContent className="sm:max-w-[750px]" style={{ background: 'rgba(20, 10, 40, 0.95)', backdropFilter: 'blur(10px)', border: '1px solid rgba(138, 43, 226, 0.4)' }}>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <BarChart className="w-5 h-5 mr-2" /> Streamer Analytics Dashboard
            </DialogTitle>
            <DialogDescription>
              Comprehensive analytics and insights for your stream
            </DialogDescription>
          </DialogHeader>
          
          <div className="overflow-y-auto pr-1" style={{ maxHeight: 'calc(80vh - 140px)' }}>
            {/* Real-time Performance */}
            <div className="mb-6">
              <h3 className="text-md font-bold mb-3 flex items-center text-purple-400">
                <Activity className="w-4 h-4 mr-2" /> Real-time Performance
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <Card style={{ background: 'rgba(30, 15, 50, 0.5)', borderColor: 'rgba(138, 43, 226, 0.2)' }} className="cosmic-pulse">
                  <CardHeader className="pb-2 pt-3">
                    <CardTitle className="text-xs">CCU</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-xl font-bold">{viewerCount}</div>
                    <div className="flex items-center text-xs text-green-400">
                      <TrendingUp className="w-3 h-3 mr-1" /> +{Math.floor(viewerCount * 0.05)}
                    </div>
                  </CardContent>
                </Card>
                
                <Card style={{ background: 'rgba(30, 15, 50, 0.5)', borderColor: 'rgba(138, 43, 226, 0.2)' }} className="cosmic-pulse">
                  <CardHeader className="pb-2 pt-3">
                    <CardTitle className="text-xs">Peak Viewers</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-xl font-bold">{viewerCount + Math.floor(viewerCount * 0.3)}</div>
                    <div className="text-xs text-gray-400">{formatTime(streamDuration - 600)}s ago</div>
                  </CardContent>
                </Card>
                
                <Card style={{ background: 'rgba(30, 15, 50, 0.5)', borderColor: 'rgba(138, 43, 226, 0.2)' }} className="cosmic-pulse">
                  <CardHeader className="pb-2 pt-3">
                    <CardTitle className="text-xs">Chat Rate</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-xl font-bold">{Math.round(chatCount / (streamDuration / 60))}/min</div>
                    <Progress value={Math.min((chatCount / 100) * 100, 100)} className="mt-1 h-1 bg-purple-900/20" />
                  </CardContent>
                </Card>
                
                <Card style={{ background: 'rgba(30, 15, 50, 0.5)', borderColor: 'rgba(138, 43, 226, 0.2)' }} className="cosmic-pulse">
                  <CardHeader className="pb-2 pt-3">
                    <CardTitle className="text-xs">Stream Health</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                      <span className="text-lg font-medium">Excellent</span>
                    </div>
                    <div className="text-xs text-gray-400">1080p @ 60fps</div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            {/* Growth Metrics */}
            <div className="mb-6">
              <h3 className="text-md font-bold mb-3 flex items-center text-blue-400">
                <TrendingUp className="w-4 h-4 mr-2" /> Growth & Engagement
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Card style={{ background: 'rgba(30, 15, 50, 0.5)', borderColor: 'rgba(138, 43, 226, 0.2)' }}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Session Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="space-y-1">
                          <div className="text-xs text-gray-400">New Followers</div>
                          <div className="text-lg font-bold">{Math.floor(viewerCount * 0.15)}</div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="text-xs text-gray-400">New Subscribers</div>
                          <div className="text-lg font-bold">{Math.floor(viewerCount * 0.06)}</div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="text-xs text-gray-400">Avg. Watch Time</div>
                          <div className="text-lg font-bold">{Math.floor(streamDuration * 0.45 / 60)}m</div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <div className="text-xs font-medium">Viewer Retention</div>
                          <div className="text-xs">{70 + Math.floor(Math.random() * 12)}%</div>
                        </div>
                        <Progress value={78} className="h-1.5 bg-purple-900/20" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <div className="text-xs font-medium">Chat Engagement</div>
                          <div className="text-xs">{50 + Math.floor(Math.random() * 20)}%</div>
                        </div>
                        <Progress value={65} className="h-1.5 bg-purple-900/20" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card style={{ background: 'rgba(30, 15, 50, 0.5)', borderColor: 'rgba(138, 43, 226, 0.2)' }}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Traffic Sources</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <div className="text-xs">Direct / Homepage</div>
                          <div className="text-xs">{Math.floor(viewerCount * 0.45)}</div>
                        </div>
                        <Progress value={45} className="h-1.5 bg-purple-900/20" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <div className="text-xs">Recommended</div>
                          <div className="text-xs">{Math.floor(viewerCount * 0.30)}</div>
                        </div>
                        <Progress value={30} className="h-1.5 bg-purple-900/20" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <div className="text-xs">Social Media</div>
                          <div className="text-xs">{Math.floor(viewerCount * 0.15)}</div>
                        </div>
                        <Progress value={15} className="h-1.5 bg-purple-900/20" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <div className="text-xs">External Websites</div>
                          <div className="text-xs">{Math.floor(viewerCount * 0.10)}</div>
                        </div>
                        <Progress value={10} className="h-1.5 bg-purple-900/20" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            {/* Revenue & Support */}
            <div className="mb-6">
              <h3 className="text-md font-bold mb-3 flex items-center text-green-400">
                <Zap className="w-4 h-4 mr-2" /> Revenue & Support
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Card style={{ background: 'rgba(30, 15, 50, 0.5)', borderColor: 'rgba(138, 43, 226, 0.2)' }}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Donations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${(viewerCount * 0.35).toFixed(2)}</div>
                    <div className="flex items-center text-xs text-green-400 mt-1">
                      <TrendingUp className="w-3 h-3 mr-1" /> +18% from last stream
                    </div>
                    <div className="text-xs text-gray-400 mt-3">Top donation: ${(viewerCount * 0.1).toFixed(2)}</div>
                  </CardContent>
                </Card>
                
                <Card style={{ background: 'rgba(30, 15, 50, 0.5)', borderColor: 'rgba(138, 43, 226, 0.2)' }}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Subscriptions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${(viewerCount * 0.25).toFixed(2)}</div>
                    <div className="flex items-center text-xs text-green-400 mt-1">
                      <TrendingUp className="w-3 h-3 mr-1" /> +5% from last stream
                    </div>
                    <div className="flex justify-between mt-3">
                      <div className="text-xs text-gray-400">New subs: {Math.floor(viewerCount * 0.06)}</div>
                      <div className="text-xs text-gray-400">Renewals: {Math.floor(viewerCount * 0.09)}</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card style={{ background: 'rgba(30, 15, 50, 0.5)', borderColor: 'rgba(138, 43, 226, 0.2)' }}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Bits & Channel Points</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{viewerCount * 25}</div>
                    <div className="flex items-center text-xs text-green-400 mt-1">
                      <TrendingUp className="w-3 h-3 mr-1" /> +12% from last stream
                    </div>
                    <div className="text-xs text-gray-400 mt-3">Channel points redeemed: {viewerCount * 250}</div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            {/* Stream Quality Metrics */}
            <div>
              <h3 className="text-md font-bold mb-3 flex items-center text-yellow-400">
                <Server className="w-4 h-4 mr-2" /> Stream Quality
              </h3>
              
              <Card style={{ background: 'rgba(30, 15, 50, 0.5)', borderColor: 'rgba(138, 43, 226, 0.2)' }}>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <div className="text-xs text-gray-400">Resolution</div>
                      <div className="font-medium">1920x1080</div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="text-xs text-gray-400">Framerate</div>
                      <div className="font-medium">60 FPS</div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="text-xs text-gray-400">Bitrate</div>
                      <div className="font-medium">6000 kbps</div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="text-xs text-gray-400">Dropped Frames</div>
                      <div className="font-medium">0.05%</div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="text-xs text-gray-400">CPU Usage</div>
                      <div className="font-medium">12%</div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="text-xs text-gray-400">Uptime</div>
                      <div className="font-medium">{formatTime(streamDuration)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <DialogFooter className="mt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowAnalytics(false)}
            >
              Close
            </Button>
            <Button 
              className="cosmic-button"
              style={{ background: 'linear-gradient(135deg, rgba(138, 43, 226, 0.8), rgba(75, 0, 130, 0.8))' }}
              onClick={() => {
                toast("Analytics report scheduled", {
                  description: "You'll receive an email with your detailed analytics shortly",
                  icon: <Check className="w-4 h-4" />
                });
              }}
            >
              <Share2 className="w-4 h-4 mr-2" /> Export Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Chat viewer component for cosmic theme
const CosmicChatViewer = ({ isLive, chatCount }: { isLive: boolean; chatCount: number }) => {
  // Generate some random chat messages based on chat count
  const generateChatMessages = () => {
    const usernames = ['CosmicVoyager', 'StarGazer92', 'NebulaExplorer', 'GalacticTitan', 'AstralWanderer'];
    const messages = [
      'Amazing stream today!',
      'The graphics look fantastic!',
      'When is the next event?',
      'Love the cosmic theme!',
      'This is out of this world!',
      'How long have you been streaming?',
      'Where can I find more of your content?',
      'The stars look beautiful tonight!'
    ];
    
    return Array.from({ length: Math.min(chatCount, 15) }).map((_, i) => {
      const username = usernames[Math.floor(Math.random() * usernames.length)];
      const message = messages[Math.floor(Math.random() * messages.length)];
      const isMod = Math.random() > 0.8;
      const isSub = !isMod && Math.random() > 0.7;
      
      return { id: i, username, message, isMod, isSub };
    });
  };
  
  const chatMessages = generateChatMessages();
  
  if (!isLive) {
    return (
      <div className="text-center py-8 text-gray-400">
        <MessageSquareOff className="w-12 h-12 mx-auto mb-2 opacity-30" />
        <p>Chat is disabled while offline</p>
        <p className="text-sm mt-2">Start streaming to enable the chat</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {chatCount === 0 ? (
        <div className="text-center py-6 text-gray-400">
          <p>No chat messages yet</p>
          <p className="text-sm mt-1">Messages will appear here when viewers chat</p>
        </div>
      ) : (
        chatMessages.map(({ id, username, message, isMod, isSub }) => (
          <div key={id} className="flex items-start animate-cosmic-float" style={{ animationDelay: `${id * 0.1}s` }}>
            {isMod && <Badge className="mt-1 mr-2">Mod</Badge>}
            {isSub && <Badge variant="outline" className="mt-1 mr-2 bg-purple-900/30">Sub</Badge>}
            <div>
              <span className={`font-bold ${isMod ? 'text-purple-400' : isSub ? 'text-yellow-400' : 'text-blue-400'}`}>{username}: </span>
              <span>{message}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default StreamingPage;
