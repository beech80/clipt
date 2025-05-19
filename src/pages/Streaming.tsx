import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { Copy, Eye, EyeOff, Layers, Settings2, Play, AlertTriangle, RefreshCw } from "lucide-react";
import { cloudflareService } from "@/services/cloudflareService";
import { Spinner } from "@/components/ui/spinner"; // Assuming you have a spinner component

export default function Streaming() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showKey, setShowKey] = useState(false);
  const [activeTab, setActiveTab] = useState("live");
  const [showStreamPlayer, setShowStreamPlayer] = useState(false);
  const [streamInfo, setStreamInfo] = useState({
    rtmpUrl: '',
    streamKey: '',
    iframeSrc: '',
    isLive: false,
    viewerCount: 0,
    usingFallback: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: `${type} Copied!`, description: `${text} copied.`, duration: 3000 });
    }).catch(err => {
      console.error('Failed to copy: ', err);
      toast({ title: "Copy Failed", variant: "destructive", duration: 3000 });
    });
  };

  const loadStreamInfo = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const streamData = await cloudflareService.getStreamInfo();
      setStreamInfo(streamData);
      
      if (streamData.usingFallback) {
        setError("Using backup streaming service. Some features may be limited.");
      }
    } catch (err) {
      console.error("Failed to load stream info:", err);
      setError("Failed to load stream information. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitializeStream = () => {
    loadStreamInfo();
    toast({ title: "Stream Initialized", description: "Copy stream details to OBS.", duration: 3000 });
  };
  
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    loadStreamInfo();
  };

  useEffect(() => {
    // Simplified tab logic
    if (location.pathname.endsWith('/schedule')) setActiveTab('schedule');
    else if (location.pathname.endsWith('/dashboard')) setActiveTab('dashboard');
    else setActiveTab('live');
  }, [location.pathname]);
  
  useEffect(() => {
    // Load stream info on component mount
    loadStreamInfo();
    
    // Set up interval to refresh stream status (every 30 seconds)
    const intervalId = setInterval(() => {
      if (activeTab === 'live') {
        loadStreamInfo();
      }
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, [activeTab]);

  return (
    <div className="streaming-container" style={{ backgroundColor: '#0D0D0D', minHeight: '100vh', color: 'white', backgroundImage: 'linear-gradient(to bottom, #1A1A1A, #0D0D0D, #0a0a14)', overflow: 'auto', position: 'relative' }}>
      {/* Removed background decorative elements */}
      
      {/* Header (simplified) */}
      <div className="relative" style={{ padding: '30px 20px', zIndex: 20, borderBottom: '2px solid rgba(255, 136, 0, 0.5)' }}>
          <div className="container mx-auto flex flex-col items-center justify-center">
            <h1 className="text-3xl font-bold text-center text-white mb-2">Stream Setup</h1>
            <p className="text-white text-opacity-90 text-center text-sm mb-3">Configure & view your livestream</p>
            {error && (
              <div className="bg-amber-900/50 border border-amber-500/50 rounded-md p-3 mb-4 flex items-center">
                <AlertTriangle className="h-5 w-5 text-amber-400 mr-2" />
                <span className="text-amber-200 text-sm">{error}</span>
                <Button variant="ghost" size="sm" className="ml-auto text-amber-200 hover:text-amber-100" onClick={handleRetry}>
                  <RefreshCw className="h-4 w-4 mr-1" /> Retry
                </Button>
              </div>
            )}
            <div className="flex items-center gap-4 mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-white bg-orange-600 hover:bg-orange-700" 
                onClick={handleInitializeStream}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span>Loading
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />Initialize Info
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-white bg-black bg-opacity-50 hover:bg-opacity-70" 
                onClick={() => setShowStreamPlayer(!showStreamPlayer)}
                disabled={isLoading || !streamInfo.iframeSrc}
              >
                <Eye className="h-4 w-4 mr-2" />{showStreamPlayer ? 'Hide Player' : 'View My Stream'}
              </Button>
              <button
                onClick={() => { setActiveTab('dashboard'); navigate('/streaming/dashboard'); }}
                className="bg-indigo-900 p-2 rounded-full shadow-md hover:bg-indigo-800 transition-colors flex items-center justify-center"
                aria-label="View Dashboard"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-100" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      
      {/* Simplified Container */}
      <div className="container max-w-6xl py-3 px-3 md:px-6 md:py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

          <div className="mt-6">
            <TabsContent value="live" className="mt-0 space-y-4">
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-orange-400">Stream Configuration (for OBS)</CardTitle>
                  <CardDescription className="text-orange-300/70">Use these details in your streaming software</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  {/* RTMP URL */}
                  <div>
                    <h3 className="text-base font-medium mb-2 text-orange-300 flex items-center"><Layers className="h-4 w-4 mr-2" />RTMP URL</h3>
                    <div className="flex gap-2">
                      <Input value={streamInfo.rtmpUrl || 'Loading...'} readOnly className="bg-slate-800 border-slate-600 text-white" />
                      <Button variant="outline" size="icon" onClick={() => copyToClipboard(streamInfo.rtmpUrl, "RTMP URL")} className="border-slate-600 text-orange-400" disabled={!streamInfo.rtmpUrl}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {/* Stream Key */}
                  <div>
                    <h3 className="text-base font-medium mb-2 text-orange-300 flex items-center"><Settings2 className="h-4 w-4 mr-2" />Stream Key</h3>
                    <div className="flex gap-2">
                      <Input type={showKey ? "text" : "password"} value={streamInfo.streamKey || 'Loading...'} readOnly className="bg-slate-800 border-slate-600 text-white" />
                      <Button variant="outline" size="icon" onClick={() => setShowKey(!showKey)} className="border-slate-600 text-orange-400" disabled={!streamInfo.streamKey}>
                        {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => copyToClipboard(streamInfo.streamKey, "Stream Key")} className="border-slate-600 text-orange-400" disabled={!streamInfo.streamKey}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Never share your stream key.</p>
                  </div>
                  <Separator className="bg-slate-700"/>
                   <Button variant="default" className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white" onClick={handleInitializeStream}>Initialize Stream</Button>
                </CardContent>
              </Card>
              {/* Stream Preview */}
              {showStreamPlayer && (
                <div className="my-4 relative p-2 bg-gradient-to-r from-purple-900/30 to-orange-900/30 rounded-lg shadow-md">
                  <h2 className="text-xl font-bold text-white mb-2 pl-2">Live Preview</h2>
                  {isLoading ? (
                    <div className="flex justify-center items-center py-16 bg-slate-900/80 rounded-lg">
                      <div className="animate-spin h-10 w-10 border-4 border-orange-500 border-t-transparent rounded-full"></div>
                    </div>
                  ) : streamInfo.iframeSrc ? (
                    <div className="relative w-full overflow-hidden rounded-lg shadow-lg" style={{ paddingTop: '56.25%' }}>
                      <iframe
                        src={streamInfo.iframeSrc}
                        className="absolute top-0 left-0 w-full h-full border-0"
                        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen={true}
                      ></iframe>
                    </div>
                  ) : (
                    <div className="flex flex-col justify-center items-center py-16 bg-slate-900/80 rounded-lg">
                      <AlertTriangle className="h-10 w-10 text-amber-400 mb-4" />
                      <p className="text-white text-center">Unable to load stream preview.</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-4 bg-amber-900/50 border-amber-500/50 text-amber-200 hover:bg-amber-800/50" 
                        onClick={handleRetry}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" /> Try Again
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
            <TabsContent value="schedule"><Card className="bg-slate-900/50 border-slate-700"><CardHeader><CardTitle>Schedule</CardTitle></CardHeader><CardContent><p className="text-slate-400">Schedule content placeholder.</p></CardContent></Card></TabsContent>
            <TabsContent value="dashboard">
              <div className="space-y-6">
                {/* Performance Overview */}
                <Card className="bg-slate-900/50 border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-orange-400">Stream Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-slate-800/60 p-4 rounded-lg border border-indigo-900/40 flex flex-col items-center justify-center">
                        <span className="text-indigo-300 text-3xl font-bold">24.3K</span>
                        <span className="text-slate-400 text-sm">Total Views</span>
                        <span className="text-green-400 text-xs mt-1">+12% this week</span>
                      </div>
                      <div className="bg-slate-800/60 p-4 rounded-lg border border-indigo-900/40 flex flex-col items-center justify-center">
                        <span className="text-indigo-300 text-3xl font-bold">742</span>
                        <span className="text-slate-400 text-sm">New Followers</span>
                        <span className="text-green-400 text-xs mt-1">+8% this week</span>
                      </div>
                      <div className="bg-slate-800/60 p-4 rounded-lg border border-indigo-900/40 flex flex-col items-center justify-center">
                        <span className="text-indigo-300 text-3xl font-bold">3.2h</span>
                        <span className="text-slate-400 text-sm">Avg. Watch Time</span>
                        <span className="text-orange-400 text-xs mt-1">-2% this week</span>
                      </div>
                      <div className="bg-slate-800/60 p-4 rounded-lg border border-indigo-900/40 flex flex-col items-center justify-center">
                        <span className="text-indigo-300 text-3xl font-bold">$238</span>
                        <span className="text-slate-400 text-sm">Revenue Generated</span>
                        <span className="text-green-400 text-xs mt-1">+15% this week</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Recent Stream Records */}
                <Card className="bg-slate-900/50 border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-orange-400">Recent Streams</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="text-left border-b border-slate-700">
                            <th className="pb-2 text-slate-300 font-medium">Stream Title</th>
                            <th className="pb-2 text-slate-300 font-medium">Date</th>
                            <th className="pb-2 text-slate-300 font-medium">Duration</th>
                            <th className="pb-2 text-slate-300 font-medium">Views</th>
                            <th className="pb-2 text-slate-300 font-medium">Peak Viewers</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-slate-800 text-slate-300">
                            <td className="py-3">Space Exploration: To The Stars</td>
                            <td className="py-3 text-slate-400">May 16, 2025</td>
                            <td className="py-3 text-slate-400">4h 23m</td>
                            <td className="py-3 text-slate-400">8,293</td>
                            <td className="py-3 text-slate-400">1,247</td>
                          </tr>
                          <tr className="border-b border-slate-800 text-slate-300">
                            <td className="py-3">Galactic Fleet Commander</td>
                            <td className="py-3 text-slate-400">May 14, 2025</td>
                            <td className="py-3 text-slate-400">3h 12m</td>
                            <td className="py-3 text-slate-400">6,152</td>
                            <td className="py-3 text-slate-400">983</td>
                          </tr>
                          <tr className="border-b border-slate-800 text-slate-300">
                            <td className="py-3">Cosmic Voyagers: First Contact</td>
                            <td className="py-3 text-slate-400">May 12, 2025</td>
                            <td className="py-3 text-slate-400">5h 47m</td>
                            <td className="py-3 text-slate-400">9,714</td>
                            <td className="py-3 text-slate-400">1,592</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Stream Info */}
                <Card className="bg-slate-900/50 border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-orange-400">Stream Info</CardTitle>
                    {streamInfo.usingFallback && (
                      <CardDescription className="text-amber-400 flex items-center mt-1">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        Using backup streaming credentials
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="flex justify-center items-center py-8">
                        <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full"></div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-white">RTMP URL</label>
                          <div className="flex">
                            <Input
                              className="bg-slate-800 border-slate-700 text-slate-300 flex-1"
                              value={streamInfo.rtmpUrl || 'Loading...'}
                              readOnly
                            />
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="ml-2 bg-slate-800 border-slate-700 hover:bg-slate-700"
                              onClick={() => copyToClipboard(streamInfo.rtmpUrl, "RTMP URL")}
                              disabled={!streamInfo.rtmpUrl}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-white">Stream Key</label>
                          <div className="flex">
                            <Input
                              className="bg-slate-800 border-slate-700 text-slate-300 flex-1"
                              type={showKey ? "text" : "password"}
                              value={streamInfo.streamKey || 'Loading...'}
                              readOnly
                            />
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="ml-2 mr-2 bg-slate-800 border-slate-700 hover:bg-slate-700"
                              onClick={() => setShowKey(!showKey)}
                              disabled={!streamInfo.streamKey}
                            >
                              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="bg-slate-800 border-slate-700 hover:bg-slate-700"
                              onClick={() => copyToClipboard(streamInfo.streamKey, "Stream Key")}
                              disabled={!streamInfo.streamKey}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}