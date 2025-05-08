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
      {/* Background decorative elements (simplified) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute h-40 w-40 rounded-full bg-orange-500 opacity-5 blur-3xl -top-10 left-1/4"></div>
      </div>
      
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
            </div>
          </div>
      </div>
      
      {/* Tabs */}
      <div className="container max-w-6xl py-3 px-3 md:px-6 md:py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex border-b border-slate-700">
            {[ { value: 'live', label: 'Stream Setup' }, { value: 'schedule', label: 'Schedule' }, { value: 'dashboard', label: 'Dashboard' } ].map(tab => (
              <button key={tab.value} className={`px-4 py-2 -mb-px text-sm font-medium ${activeTab === tab.value ? 'border-b-2 border-orange-500 text-orange-500' : 'text-slate-300 hover:text-orange-400'}`}
                onClick={() => { setActiveTab(tab.value); navigate(tab.value === 'live' ? '/streaming' : `/streaming/${tab.value}`); }}>
                {tab.label}
              </button>
            ))}
          </div>

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
            <TabsContent value="dashboard"><Card className="bg-slate-900/50 border-slate-700"><CardHeader><CardTitle>Dashboard</CardTitle></CardHeader><CardContent><p className="text-slate-400">Dashboard content placeholder.</p></CardContent></Card></TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}