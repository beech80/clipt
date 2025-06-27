import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Copy, Eye, EyeOff, Server, Check, Video, BarChart, Share2, Shield, Zap, Settings, ChevronLeft, Users, Tv, MessageCircle, Star, GiftIcon } from "lucide-react";
import { toast } from "sonner";

import CosmicChatViewer from "@/components/CosmicChatViewer";

// Main Streaming Page Component
const StreamingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showKey, setShowKey] = useState(false);
  const [activeTab, setActiveTab] = useState("live");
  const [showChatViewer, setShowChatViewer] = useState(false);
  const [showStreamPlayer, setShowStreamPlayer] = useState(false);
  
  // Function to toggle chat viewer modal with enhanced reliability
  const toggleChatViewer = () => {
    // Force update the chat viewer state
    setShowChatViewer(prevState => {
      const newState = !prevState;
      console.log('Chat viewer toggled:', newState);
      return newState;
    });
  };
  
  // Stream info loading state
  const [isLoading, setIsLoading] = useState(true);
  
  // Stream info
  const [streamInfo, setStreamInfo] = useState({
    streamKey: "live_1234567890abcdef",
    serverUrl: "rtmp://live.clipt.cc/stream",
    playbackUrl: "https://stream.clipt.cc/watch/1234567890abcdef",
    usingFallback: false
  });
  
  // Simulate loading stream info
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Function to copy to clipboard
  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${type} copied to clipboard`);
    } catch (err) {
      console.error("Failed to copy:", err);
      toast.error("Failed to copy to clipboard");
    }
  };
  
  // Handle tab changes
  useEffect(() => {
    console.log("Active tab changed to:", activeTab);
  }, [activeTab]);

  return (
    <div className="streaming-container" style={{ 
      backgroundColor: '#0D0D0D', 
      minHeight: '100vh', 
      color: 'white', 
      backgroundImage: 'linear-gradient(to bottom, #1A1A1A, #0D0D0D, #0a0a14)', 
      overflow: 'auto', 
      position: 'relative' 
    }}>
      {/* Header */}
      <div className="relative" style={{ 
        padding: '30px 20px', 
        zIndex: 20, 
        borderBottom: '2px solid rgba(255, 136, 0, 0.5)' 
      }}>
        <div className="container mx-auto flex flex-col items-center justify-center">
          <h1 className="text-3xl font-bold text-center text-white mb-2">Stream Setup</h1>
          <p className="text-white text-opacity-90 text-center text-sm mb-3">Configure & view your livestream</p>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Cosmic Chat Viewer Display */}
        <div className="mb-8">
          <Card className="overflow-hidden border border-purple-700/40 bg-black/50">
            <CardHeader className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 pb-2">
              <CardTitle className="text-xl flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-purple-400" /> 
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-indigo-200">Cosmic Chat Viewer</span>
              </CardTitle>
              <CardDescription className="text-purple-300/80">
                Monitor your chat in our enhanced space-themed viewer
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <CosmicChatViewer />
            </CardContent>
          </Card>
        </div>
        
        {/* Navigation tabs */}
        <div className="mb-6 mt-4">
          <Tabs
            defaultValue={activeTab}
            onValueChange={(value) => {
              setActiveTab(value);
              // No navigation, just tab switch
            }}
            className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="live">Live Stream</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="live">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Stream Information */}
                <Card className="mb-6">
                  <CardHeader className="flex flex-col space-y-1 pb-2">
                    <CardTitle className="text-xl">Stream Information</CardTitle>
                    <CardDescription>
                      Your stream settings and connection information
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="animate-pulse space-y-4">
                        <div className="bg-slate-800 h-12 rounded-md"></div>
                        <div className="bg-slate-800 h-12 rounded-md"></div>
                        <div className="bg-slate-800 h-12 rounded-md"></div>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm text-slate-400 mb-1 block">Stream Key</label>
                            <div className="flex">
                              <Input
                                readOnly
                                className="font-mono bg-black/60 border-slate-700 text-slate-300 flex-1"
                                type={showKey ? "text" : "password"}
                                value={streamInfo.streamKey}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="ml-2"
                                onClick={() => setShowKey(!showKey)}
                              >
                                {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="ml-1"
                                onClick={() => copyToClipboard(streamInfo.streamKey, "Stream key")}
                              >
                                <Copy size={18} />
                              </Button>
                            </div>
                          </div>
                          
                          <div>
                            <label className="text-sm text-slate-400 mb-1 block">Server URL</label>
                            <div className="flex">
                              <Input
                                readOnly
                                className="font-mono bg-black/60 border-slate-700 text-slate-300 flex-1"
                                value={streamInfo.serverUrl}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="ml-1"
                                onClick={() => copyToClipboard(streamInfo.serverUrl, "Server URL")}
                              >
                                <Copy size={18} />
                              </Button>
                            </div>
                          </div>
                          
                          <div>
                            <label className="text-sm text-slate-400 mb-1 block">Playback URL</label>
                            <div className="flex">
                              <Input
                                readOnly
                                className="font-mono bg-black/60 border-slate-700 text-slate-300 flex-1"
                                value={streamInfo.playbackUrl}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="ml-1"
                                onClick={() => copyToClipboard(streamInfo.playbackUrl, "Playback URL")}
                              >
                                <Copy size={18} />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between border-t border-slate-800 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-white bg-indigo-900 hover:bg-indigo-800"
                      onClick={() => navigate('/stream-analytics')}
                    >
                      <BarChart className="h-4 w-4 mr-2" />
                      Stream Analytics
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-white bg-purple-900 hover:bg-purple-800 relative overflow-hidden group"
                      onClick={toggleChatViewer}
                    >
                      {/* Cosmic button effect */}
                      <span className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      {showChatViewer ? 'Hide Chat' : 'View Chat'}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="analytics">
              <Card>
                <CardHeader>
                  <CardTitle>Stream Analytics</CardTitle>
                  <CardDescription>View your streaming performance metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-10">
                    <BarChart className="mx-auto h-12 w-12 text-slate-500 mb-4" />
                    <h3 className="text-lg font-medium">Analytics Dashboard</h3>
                    <p className="text-sm text-slate-400 mt-2">
                      Track viewer counts, engagement metrics, and stream performance
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Stream Settings</CardTitle>
                  <CardDescription>Configure your stream preferences</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-10">
                    <Settings className="mx-auto h-12 w-12 text-slate-500 mb-4" />
                    <h3 className="text-lg font-medium">Stream Configuration</h3>
                    <p className="text-sm text-slate-400 mt-2">
                      Adjust quality settings, privacy options, and more
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Chat Viewer Modal (conditionally displayed) */}
      {showChatViewer && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="relative w-full max-w-2xl h-[85vh] overflow-hidden rounded-2xl shadow-[0_0_35px_rgba(138,43,226,0.3)]" 
            style={{ 
              background: 'radial-gradient(circle at center, rgba(25, 25, 40, 0.9) 0%, rgba(10, 10, 20, 0.95) 70%, rgba(5, 5, 15, 0.98) 100%)', 
              boxShadow: '0 0 40px rgba(138, 43, 226, 0.4), inset 0 0 20px rgba(88, 28, 135, 0.3)', 
              borderImage: 'linear-gradient(135deg, rgba(125, 39, 255, 0.8), rgba(65, 20, 138, 0.2), rgba(125, 39, 255, 0.8)) 1', 
              borderWidth: '1px', 
              borderStyle: 'solid' 
            }}>
            {/* Modal Content - Close button */}
            <div className="flex justify-end p-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleChatViewer}
                className="text-purple-300 hover:text-white hover:bg-purple-900/50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </Button>
            </div>
            
            {/* Modal Content - Chat viewer */}
            <div className="p-4">
              <h2 className="text-2xl font-bold text-center mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-300">
                Cosmic Chat Viewer
              </h2>
              <p className="text-center text-purple-200/70 mb-6">
                Monitor your chat in a beautiful space-themed interface
              </p>
              
              <Button 
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 border-none"
                onClick={toggleChatViewer}
              >
                Return to Stream
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StreamingPage;
