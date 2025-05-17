import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { Copy, Eye, EyeOff, Layers, Settings2, Play } from "lucide-react"; // Minimal icons

// Cloudflare Stream Details
const CLOUDFLARE_RTMP_URL = 'rtmps://live.cloudflare.com:443/live/';
const CLOUDFLARE_STREAM_KEY = 'b85100c2649f22b80a848a3b50ffc15ck9c68e56dc78a0135ceb29ae577eee421'; // Full RTMP Key from Cloudflare
const CLOUDFLARE_IFRAME_SRC = 'https://customer-9cbdk1udzakdxkzu.cloudflarestream.com/9c68e56dc78a0135ceb29ae577eee421/iframe';

export default function Streaming() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showKey, setShowKey] = useState(false);
  const [activeTab, setActiveTab] = useState("live");
  const [showStreamPlayer, setShowStreamPlayer] = useState(false);

  const RTMP_URL_DISPLAY = CLOUDFLARE_RTMP_URL;
  const STREAM_KEY_DISPLAY = CLOUDFLARE_STREAM_KEY;

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: `${type} Copied!`, description: `${text} copied.`, duration: 3000 });
    }).catch(err => {
      console.error('Failed to copy: ', err);
      toast({ title: "Copy Failed", variant: "destructive", duration: 3000 });
    });
  };

  const handleInitializeStream = () => {
    toast({ title: "Stream Initialized", description: "Copy stream details to OBS.", duration: 3000 });
  };

  useEffect(() => {
    // Simplified tab logic
    if (location.pathname.endsWith('/schedule')) setActiveTab('schedule');
    else if (location.pathname.endsWith('/dashboard')) setActiveTab('dashboard');
    else setActiveTab('live');
  }, [location.pathname]);

  return (
    <div className="streaming-container" style={{ backgroundColor: '#0D0D0D', minHeight: '100vh', color: 'white', backgroundImage: 'linear-gradient(to bottom, #1A1A1A, #0D0D0D, #0a0a14)', overflow: 'auto', position: 'relative' }}>
      {/* Removed background decorative elements */}
      
      {/* Header (simplified) */}
      <div className="relative" style={{ padding: '30px 20px', zIndex: 20, borderBottom: '2px solid rgba(255, 136, 0, 0.5)' }}>
          <div className="container mx-auto flex flex-col items-center justify-center">
            <h1 className="text-3xl font-bold text-center text-white mb-2">Stream Setup</h1>
            <p className="text-white text-opacity-90 text-center text-sm mb-3">Configure & view your livestream</p>
            <div className="flex items-center gap-4 mt-2">
              <Button variant="outline" size="sm" className="text-white bg-orange-600 hover:bg-orange-700" onClick={handleInitializeStream}>
                <Play className="h-4 w-4 mr-2" />Initialize Info
              </Button>
              <Button variant="outline" size="sm" className="text-white bg-black bg-opacity-50 hover:bg-opacity-70" onClick={() => setShowStreamPlayer(!showStreamPlayer)}>
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
                      <Input value={RTMP_URL_DISPLAY} readOnly className="bg-slate-800 border-slate-600 text-white" />
                      <Button variant="outline" size="icon" onClick={() => copyToClipboard(RTMP_URL_DISPLAY, "RTMP URL")} className="border-slate-600 text-orange-400"><Copy className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  {/* Stream Key */}
                  <div>
                    <h3 className="text-base font-medium mb-2 text-orange-300 flex items-center"><Settings2 className="h-4 w-4 mr-2" />Stream Key</h3>
                    <div className="flex gap-2">
                      <Input type={showKey ? "text" : "password"} value={STREAM_KEY_DISPLAY} readOnly className="bg-slate-800 border-slate-600 text-white" />
                      <Button variant="outline" size="icon" onClick={() => setShowKey(!showKey)} className="border-slate-600 text-orange-400">{showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
                      <Button variant="outline" size="icon" onClick={() => copyToClipboard(STREAM_KEY_DISPLAY, "Stream Key")} className="border-slate-600 text-orange-400"><Copy className="h-4 w-4" /></Button>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Never share your stream key.</p>
                  </div>
                  <Separator className="bg-slate-700"/>
                   <Button variant="default" className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white" onClick={handleInitializeStream}>Initialize Stream</Button>
                </CardContent>
              </Card>
              {/* Conditional Stream Player */}
              {showStreamPlayer && (
                <Card className="mt-4 bg-slate-900/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-purple-400">Live Stream Player</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 relative aspect-video">
                    <iframe src={CLOUDFLARE_IFRAME_SRC} style={{ border: 'none', position: 'absolute', top: 0, left: 0, height: '100%', width: '100%' }} allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;" allowFullScreen={true} className="w-full h-full"></iframe>
                  </CardContent>
                </Card>
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
                
                {/* Growth Metrics */}
                <Card className="bg-slate-900/50 border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-orange-400">Clipt Coin Earnings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-slate-300 font-medium">Total Balance</p>
                          <p className="text-2xl text-indigo-300 font-bold">1,240 Clipt Coins</p>
                        </div>
                        <div className="bg-slate-800/80 px-3 py-1.5 rounded-md border border-indigo-800/30">
                          <p className="text-xs text-slate-400">Tracking Active</p>
                          <p className="text-xs text-green-400">All metrics monitored</p>
                        </div>
                      </div>
                      
                      <div className="bg-slate-800/60 p-3 rounded-lg space-y-3">
                        <p className="text-slate-300 font-medium">Recent Earnings</p>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Stream Completion Bonus</span>
                            <span className="text-green-400 font-medium">+60 Coins</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">First-time Viewer Reward</span>
                            <span className="text-green-400 font-medium">+25 Coins</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Stream Surge Boost Used</span>
                            <span className="text-red-400 font-medium">-50 Coins</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Weekly Pro Bonus</span>
                            <span className="text-green-400 font-medium">+100 Coins</span>
                          </div>
                        </div>
                      </div>
                    </div>
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