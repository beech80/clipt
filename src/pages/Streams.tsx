import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Eye, EyeOff, Server, Shield, Video, Tv } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export default function Streams() {
  const navigate = useNavigate();
  const [showKey, setShowKey] = useState(false);
  
  // Stream settings
  const RTMP_URL = "rtmp://live.clipt.cc/live";
  const STREAM_KEY = "live_5f9b3a2e1d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a";
  
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

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white overflow-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#FF8A00] to-[#FF5800] p-4 flex justify-between items-center">
        <div className="flex items-center">
          <span className="text-white font-bold text-lg flex items-center">
            <Tv className="h-5 w-5 mr-2" />
            Stream Setup
          </span>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          className="text-white border-white/20 bg-black/20 hover:bg-black/30"
          onClick={() => navigate('/streaming')}
        >
          <Video className="h-4 w-4 mr-2" />
          View Stream
        </Button>
      </div>

      <div className="container mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Streaming Dashboard</h1>
          <p className="text-gray-400">Configure your stream and monitor its health</p>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 bg-black rounded overflow-hidden mb-6">
          <button className="py-2 px-4 bg-[#FF5500]/20 border-b-2 border-[#FF5500] text-[#FF5500] font-medium flex items-center justify-center">
            <span className="inline-block h-4 w-4 mr-2 bg-center bg-no-repeat" style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23FF5500\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"2\" y=\"3\" width=\"20\" height=\"14\" rx=\"2\" ry=\"2\"></rect><line x1=\"8\" y1=\"21\" x2=\"16\" y2=\"21\"></line><line x1=\"12\" y1=\"17\" x2=\"12\" y2=\"21\"></line></svg>')" }}></span>
            Setup
          </button>
          <button className="py-2 px-4 bg-black text-gray-400 flex items-center justify-center">
            <span className="inline-block h-4 w-4 mr-2 bg-center bg-no-repeat" style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23aaaaaa\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"2\" y=\"2\" width=\"20\" height=\"8\" rx=\"2\" ry=\"2\"></rect><rect x=\"2\" y=\"14\" width=\"20\" height=\"8\" rx=\"2\" ry=\"2\"></rect><line x1=\"6\" y1=\"6\" x2=\"6.01\" y2=\"6\"></line><line x1=\"6\" y1=\"18\" x2=\"6.01\" y2=\"18\"></line></svg>')" }}></span>
            Analytics
          </button>
          <button className="py-2 px-4 bg-black text-gray-400 flex items-center justify-center">
            <span className="inline-block h-4 w-4 mr-2 bg-center bg-no-repeat" style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23aaaaaa\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M22 8.01A5 5 0 0 0 17 3C13 3 12 7 12 8c0 3.5 5 4 5 8 0 2.5-1.5 3-2.99 3H14\" /><path d=\"M18 10V3\" /><path d=\"M22 2l-4 2-4-2\" /><path d=\"M6 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z\" /><path d=\"m7 19 5-5\" /><path d=\"m13 18-5 5-5-5\" /></svg>')" }}></span>
            OBS Guide
          </button>
        </div>

        {/* Main Content */}
        <div className="bg-[#1c1c1c] rounded-md border border-[#FF5500]/30 overflow-hidden mb-6">
          <div className="p-4 border-b border-[#FF5500]/20">
            <h2 className="text-xl font-bold text-[#FF5500] flex items-center">
              <span className="inline-block h-5 w-5 mr-2 bg-center bg-no-repeat" style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23FF5500\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M13 2 3 14h9l-1 8 10-12h-9l1-8z\"></path></svg>')" }}></span>
              Stream Configuration
            </h2>
            <p className="text-gray-400 text-sm">Copy these details to your streaming software</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Stream URL */}
            <div>
              <h3 className="text-sm font-medium mb-2 text-[#FF5500] flex items-center">
                <Server className="h-4 w-4 mr-2" />
                Stream URL
              </h3>
              <div className="rounded overflow-hidden flex">
                <div className="bg-black/50 text-white p-2 flex-grow font-mono">
                  {RTMP_URL}
                </div>
                <button 
                  className="bg-[#262626] hover:bg-[#333333] px-3 flex items-center justify-center border-l border-[#444444]"
                  onClick={() => copyToClipboard(RTMP_URL, "Stream URL")}
                >
                  <Copy className="h-4 w-4 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Stream Key */}
            <div>
              <h3 className="text-sm font-medium mb-2 text-[#FF5500] flex items-center">
                <Shield className="h-4 w-4 mr-2" />
                Stream Key
              </h3>
              <div className="rounded overflow-hidden flex">
                <div className="bg-black/50 text-white p-2 flex-grow font-mono">
                  {showKey ? STREAM_KEY : '•••••••••••••••••••••••••••••••'}
                </div>
                <button 
                  className="bg-[#262626] hover:bg-[#333333] px-3 flex items-center justify-center border-r border-[#444444]"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                </button>
                <button 
                  className="bg-[#262626] hover:bg-[#333333] px-3 flex items-center justify-center border-l border-[#444444]"
                  onClick={() => copyToClipboard(STREAM_KEY, "Stream Key")}
                >
                  <Copy className="h-4 w-4 text-gray-400" />
                </button>
              </div>
              <p className="text-[#FF5500]/80 text-xs mt-1">Keep your stream key private. Never share it publicly.</p>
            </div>

            {/* Recommended Settings */}
            <div className="pt-4 border-t border-[#FF5500]/20">
              <h3 className="text-lg font-medium mb-4 text-[#FF5500]">Recommended Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Video</h4>
                  <ul className="text-sm space-y-1 text-gray-300">
                    <li>Resolution: 1920x1080 (or 1280x720)</li>
                    <li>Framerate: 60fps (or 30fps)</li>
                    <li>Keyframe Interval: 2 seconds</li>
                    <li>Preset: Quality or Performance</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Audio</h4>
                  <ul className="text-sm space-y-1 text-gray-300">
                    <li>Bitrate: 128-320 Kbps</li>
                    <li>Sample Rate: 48 KHz</li>
                    <li>Channels: Stereo</li>
                    <li>Format: AAC</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Share Your Stream */}
            <div className="pt-4 border-t border-[#FF5500]/20">
              <h3 className="text-sm font-medium mb-2 text-[#FF5500] flex items-center">
                <span className="inline-block h-4 w-4 mr-2 bg-center bg-no-repeat" style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%23FF5500\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"18\" cy=\"5\" r=\"3\"></circle><circle cx=\"6\" cy=\"12\" r=\"3\"></circle><circle cx=\"18\" cy=\"19\" r=\"3\"></circle><line x1=\"8.59\" y1=\"13.51\" x2=\"15.42\" y2=\"17.49\"></line><line x1=\"15.41\" y1=\"6.51\" x2=\"8.59\" y2=\"10.49\"></line></svg>')" }}></span>
                Share Your Stream
              </h3>
              <div className="rounded overflow-hidden flex">
                <input
                  type="text"
                  readOnly
                  value="https://clipt.cc/your-username"
                  className="bg-black/50 text-gray-400 p-2 flex-grow outline-none"
                />
                <button 
                  className="bg-[#262626] hover:bg-[#333333] px-3 flex items-center justify-center border-l border-[#444444]"
                  onClick={() => copyToClipboard("https://clipt.cc/your-username", "Stream URL")}
                >
                  <Copy className="h-4 w-4 text-gray-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-[#FF5500]/20 p-4 flex justify-between items-center">
            <div className="flex items-center text-sm">
              <span className="h-2 w-2 rounded-full bg-[#FF5500] mr-2"></span>
              <span>Waiting for Stream</span>
            </div>
            <Button className="bg-gradient-to-r from-[#FF8A00] to-[#FF5800] hover:from-[#FF7A00] hover:to-[#FF4800] text-white">
              <Video className="h-4 w-4 mr-2" />
              Start Stream
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
