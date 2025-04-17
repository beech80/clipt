import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy, Eye, EyeOff, Server, Check, Video, BarChart, Share2, Shield, Zap, Settings, ChevronLeft, AlertTriangle, Users, Tv, Cpu, Activity } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { motion } from 'framer-motion';
import '@/styles/advanced-streaming.css';

// Define keyframes for the pulse animation
const pulseKeyframes = `
  @keyframes pulse {
    0% { transform: scale(1); box-shadow: 0 0 15px rgba(255, 255, 255, 0.3); }
    50% { transform: scale(1.05); box-shadow: 0 0 20px rgba(255, 255, 255, 0.5); }
    100% { transform: scale(1); box-shadow: 0 0 15px rgba(255, 255, 255, 0.3); }
  }
`;
import { useNavigate } from 'react-router-dom';

export default function StreamSetup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showKey, setShowKey] = useState(false);
  const [activeTab, setActiveTab] = useState("setup");
  const [streamActive, setStreamActive] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("good"); // good, warning, critical
  const [cdnNodes, setCdnNodes] = useState(12); // Number of active CDN nodes
  const [serverLoad, setServerLoad] = useState(32); // Percentage
  const [viewerCount, setViewerCount] = useState(0);
  const [streamUptime, setStreamUptime] = useState(0); // in seconds
  
  // In production, these would be fetched from the backend
  const RTMP_URL = "rtmp://live.clipt.cc/live";
  const STREAM_KEY = user?.id ? `live_${user.id.substring(0, 8)}` : "live_5f9b3a2e1d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a";
  
  // Function to go live manually for testing
  const toggleStreamStatus = () => {
    setStreamActive(!streamActive);
    if (!streamActive) {
      // Reset stream uptime when starting a new stream
      setStreamUptime(0);
      // Start with a base number of viewers
      setViewerCount(Math.floor(Math.random() * 10));
      toast.success("Stream started", {
        description: "Your stream is now live!"
      });
    } else {
      toast.info("Stream ended", {
        description: "Your stream has been stopped."
      });
    }
  };
  
  // Simulate checking stream status and update metrics
  useEffect(() => {
    const interval = setInterval(() => {
      // Update server metrics
      const newLoad = Math.floor(Math.random() * 40) + 20; // 20-60% load
      setServerLoad(newLoad);
      
      if (streamActive) {
        // Increment uptime when stream is active
        setStreamUptime(prev => prev + 10);
        // Randomly adjust viewer count when streaming
        setViewerCount(prev => {
          const change = Math.floor(Math.random() * 5) - 2; // -2 to +2
          return Math.max(0, prev + change);
        });
      }
      
      // Randomly toggle stream active state for demo with 10% probability
      if (Math.random() > 0.9) {
        setStreamActive(prev => !prev);
        if (!streamActive) {
          // Reset stream uptime when starting a new stream
          setStreamUptime(0);
          // Start with a base number of viewers
          setViewerCount(Math.floor(Math.random() * 10));
        }
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [streamActive]);

  // Copy to clipboard function
  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast("Copied!", {
        description: `${type} copied to clipboard.`,
        duration: 2000,
      });
    } catch (err) {
      console.error("Failed to copy:", err);
      toast.error("Copy Failed", {
        description: "Please try again or copy manually."
      });
    }
  };

  // Format stream uptime
  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Navigate back to the main streaming page
  const goBack = () => {
    navigate('/streaming');
  };

  // Add the animation styles to the document
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = pulseKeyframes;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  return (
    <div style={{
      backgroundColor: '#1A1A1A',
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
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        boxShadow: '0 4px 12px rgba(255, 88, 0, 0.3)'
      }}>
        <div style={{
          position: 'absolute',
          left: '20px',
        }}>
          <Button
            variant="ghost"
            size="icon"
            onClick={goBack}
            style={{ color: 'white' }}
          >
            <ChevronLeft size={24} />
          </Button>
        </div>
        
        <div className="flex items-center gap-3">
          <div style={{
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '50%',
            width: '42px',
            height: '42px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(255, 255, 255, 0.3)',
            animation: 'pulse 2s infinite'
          }}>
            <Tv size={24} style={{ color: 'white' }} />
          </div>
          <h1 className="text-xl font-bold" style={{ color: 'white', textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)' }}>Stream Setup</h1>
        </div>
        
        <div style={{
          position: 'absolute',
          right: '20px',
        }}>
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
              onClick={() => navigate(`/streaming/${user?.id || '1'}`)}
            >
              <Tv className="h-4 w-4" />
              <span className="hidden sm:inline">View Stream</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="container max-w-screen-xl mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: '#FF7700' }}>Streaming Dashboard</h2>
              <p className="text-gray-400">Configure your stream and monitor its health</p>
            </div>
            
            <div className="flex items-center space-x-4">
              {streamActive ? (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-3 py-2 px-4 rounded-full" 
                  style={{ 
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(0, 255, 0, 0.3)'
                  }}
                >
                  <div className="pulse-dot"></div>
                  <span className="text-green-400 font-medium">LIVE</span>
                  <span className="text-gray-300">{formatUptime(streamUptime)}</span>
                  <span className="flex items-center text-gray-300 gap-1 ml-2">
                    <Users size={14} />
                    {viewerCount}
                  </span>
                </motion.div>
              ) : (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={toggleStreamStatus}
                    className="flex items-center gap-2"
                    style={{
                      background: 'linear-gradient(135deg, #FF5500, #FF7700)',
                      color: 'white',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(255, 85, 0, 0.3)'
                    }}
                  >
                    <Activity className="h-4 w-4" />
                    Go Live
                  </Button>
                </motion.div>
              )}
              
              {streamActive && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    onClick={toggleStreamStatus}
                    className="flex items-center gap-2"
                    style={{
                      borderColor: 'rgba(255, 0, 0, 0.3)',
                      color: 'rgb(255, 80, 80)'
                    }}
                  >
                    <Activity className="h-4 w-4" />
                    End Stream
                  </Button>
                </motion.div>
              )}
            </div>
          </div>

          <Tabs defaultValue="setup" value={activeTab}>
            <TabsList className="grid grid-cols-3" style={{ background: 'rgba(255, 88, 0, 0.15)', borderColor: 'rgba(255, 135, 0, 0.3)' }}>
              <TabsTrigger 
                value="setup" 
                onClick={() => setActiveTab("setup")}
                style={{ 
                  color: activeTab === "setup" ? '#FF7700' : 'rgba(255, 255, 255, 0.7)', 
                  fontWeight: activeTab === "setup" ? 'bold' : 'normal'
                }}
              >
                <Settings className="h-4 w-4 mr-2" style={{ color: activeTab === "setup" ? '#FF7700' : 'inherit' }} />
                Setup
              </TabsTrigger>
              <TabsTrigger 
                value="stats" 
                onClick={() => setActiveTab("stats")}
                style={{ 
                  color: activeTab === "stats" ? '#FF7700' : 'rgba(255, 255, 255, 0.7)', 
                  fontWeight: activeTab === "stats" ? 'bold' : 'normal'
                }}
              >
                <BarChart className="h-4 w-4 mr-2" style={{ color: activeTab === "stats" ? '#FF7700' : 'inherit' }} />
                Analytics
              </TabsTrigger>
              <TabsTrigger 
                value="guide" 
                onClick={() => setActiveTab("guide")}
                style={{ 
                  color: activeTab === "guide" ? '#FF7700' : 'rgba(255, 255, 255, 0.7)', 
                  fontWeight: activeTab === "guide" ? 'bold' : 'normal'
                }}
              >
                <Video className="h-4 w-4 mr-2" style={{ color: activeTab === "guide" ? '#FF7700' : 'inherit' }} />
                OBS Guide
              </TabsTrigger>
            </TabsList>
            
            {/* Setup Tab */}
            <TabsContent value="setup" className="space-y-6">
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                <Card className="stream-card" style={{
                  background: 'linear-gradient(135deg, rgba(25, 15, 0, 0.6), rgba(40, 20, 0, 0.8))',
                  border: '1px solid rgba(255, 135, 0, 0.3)',
                  boxShadow: '0 8px 20px rgba(255, 88, 0, 0.15)'
                }}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl" style={{
                      color: '#FF7700',
                      textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                    }}>
                      <Zap className="h-5 w-5 text-orange-400" />
                      Stream Configuration
                    </CardTitle>
                    <CardDescription style={{ color: 'white' }}>
                      Copy these details to your streaming software
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    {/* Stream URL Section */}
                    <div style={{ position: 'relative' }}>
                      <h3 className="text-md font-medium mb-2" style={{ 
                        color: 'white',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px' 
                      }}>
                        <Server className="h-4 w-4" />
                        Stream URL
                      </h3>
                      {streamActive ? (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <div style={{ position: 'relative', flexGrow: 1 }}>
                            <Input
                              value={RTMP_URL}
                              readOnly
                              className="font-mono"
                              style={{ 
                                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                color: 'white',
                                border: '1px solid rgba(255, 119, 0, 0.3)'
                              }}
                            />
                          </div>
                          
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              variant="outline"
                              onClick={() => copyToClipboard(RTMP_URL, 'Stream URL')}
                              className="stream-copy-button"
                              style={{
                                borderColor: 'rgba(255, 119, 0, 0.3)',
                                color: '#FF7700'
                              }}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Copy
                            </Button>
                          </motion.div>
                        </div>
                      ) : (
                        <div style={{ 
                          backgroundColor: 'rgba(0, 0, 0, 0.3)',
                          border: '1px solid rgba(255, 119, 0, 0.3)',
                          borderRadius: '6px',
                          padding: '10px 16px',
                          color: '#e0e0e0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px'
                        }}>
                          <AlertTriangle size={18} style={{ color: '#FF7700' }} />
                          <span>Stream URL will appear when you go live</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Stream Key Section */}
                    <div>
                      <h3 className="text-md font-medium mb-2" style={{ 
                        color: '#FF7700',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <Shield className="h-4 w-4" />
                        Stream Key
                      </h3>
                      {streamActive ? (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <div style={{ position: 'relative', flexGrow: 1 }}>
                            <Input
                              type={showKey ? "text" : "password"}
                              value={STREAM_KEY}
                              readOnly
                              className="font-mono"
                              style={{ 
                                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                color: 'white',
                                border: '1px solid rgba(255, 119, 0, 0.3)'
                              }}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setShowKey(!showKey)}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2"
                            >
                              {showKey ? (
                                <EyeOff className="h-4 w-4 text-gray-400" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-400" />
                              )}
                            </Button>
                          </div>
                          
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              variant="outline"
                              onClick={() => copyToClipboard(STREAM_KEY, 'Stream Key')}
                              className="stream-copy-button"
                              style={{
                                borderColor: 'rgba(255, 119, 0, 0.3)',
                                color: '#FF7700'
                              }}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Copy
                            </Button>
                          </motion.div>
                        </div>
                      ) : (
                        <div style={{ 
                          backgroundColor: 'rgba(0, 0, 0, 0.3)',
                          border: '1px solid rgba(255, 119, 0, 0.3)',
                          borderRadius: '6px',
                          padding: '10px 16px',
                          color: '#e0e0e0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px'
                        }}>
                          <Shield size={18} style={{ color: '#FF7700' }} />
                          <span>Stream key will be revealed when you go live</span>
                        </div>
                      )}
                      
                      
                      <p className="text-xs mt-2" style={{ color: 'rgba(255, 120, 0, 0.8)' }}>
                        <AlertTriangle className="h-3 w-3 inline-block mr-1" />
                        Keep your stream key private. Never share it publicly.
                      </p>
                    </div>
                    
                    <Separator className="my-6" style={{ background: 'rgba(255, 135, 0, 0.3)' }} />
                    
                    {/* Additional Streaming Settings */}
                    <div>
                      <h3 className="text-md font-medium mb-4" style={{ 
                        color: 'white',
                        fontWeight: 'bold'
                      }}>
                        Recommended Settings
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="setting-card">
                          <h4 className="setting-title" style={{ color: 'white' }}>Video</h4>
                          <ul className="setting-list" style={{ color: 'white' }}>
                            <li>Resolution: 1920x1080 (or 1280x720)</li>
                            <li>Framerate: 60fps (or 30fps)</li>
                            <li>Keyframe Interval: 2 seconds</li>
                            <li>Preset: Quality or Performance</li>
                          </ul>
                        </div>
                        
                        <div className="setting-card">
                          <h4 className="setting-title" style={{ color: 'white' }}>Audio</h4>
                          <ul className="setting-list" style={{ color: 'white' }}>
                            <li>Bitrate: 128-320 Kbps</li>
                            <li>Sample Rate: 48 KHz</li>
                            <li>Channels: Stereo</li>
                            <li>Format: AAC</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    
                    {/* Share Stream Section */}
                    <div className="mt-4">
                      <h3 className="text-md font-medium mb-3" style={{ 
                        color: 'white',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <Share2 className="h-4 w-4" />
                        Share Your Stream
                      </h3>
                      
                      <div className="share-link-container">
                        <Input
                          value={`https://clipt.cc/${user?.username || 'your-username'}`}
                          readOnly
                          className="share-link font-mono"
                          style={{ 
                            backgroundColor: 'rgba(0, 0, 0, 0.3)',
                            color: 'white',
                            border: '1px solid rgba(255, 135, 0, 0.3)'
                          }}
                        />
                        <div className="share-buttons mt-3 flex space-x-2">
                          <motion.div 
                            className="inline-block"
                            whileHover={{ scale: 1.05 }} 
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(`https://clipt.cc/${user?.username || 'your-username'}`, 'Stream URL')}
                              className="stream-share-button"
                              style={{
                                borderColor: 'rgba(255, 119, 0, 0.3)',
                                color: '#FF7700'
                              }}
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Copy
                            </Button>
                          </motion.div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="justify-between pt-5" style={{ borderTop: '1px solid rgba(255, 135, 0, 0.2)' }}>
                    <div className="status-display flex items-center">
                      {streamActive ? (
                        <div className="status-active flex items-center">
                          <div className="pulse-dot mr-2"></div>
                          <span className="text-sm font-medium">Stream Active</span>
                        </div>
                      ) : (
                        <div className="status-inactive flex items-center">
                          <div className="inactive-dot mr-2"></div>
                          <span className="text-sm font-medium" style={{ color: 'white' }}>Waiting for Stream</span>
                        </div>
                      )}
                    </div>
                    
                    <Button
                      onClick={() => navigate(`/streaming/${user?.id || '1'}`)}
                      className="view-stream-button"
                      style={{
                        background: 'linear-gradient(to right, #FF8A00, #FF5800)',
                        boxShadow: '0 4px 10px rgba(255, 88, 0, 0.4)'
                      }}
                    >
                      <Tv className="h-4 w-4 mr-2" />
                      View Stream
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            </TabsContent>
            
            {/* Analytics Tab */}
            <TabsContent value="stats">
              <Card className="stream-card" style={{
                maxWidth: '800px',
                margin: '0 auto',
                background: 'linear-gradient(135deg, #121218, #1A1A20)',
                border: '1px solid rgba(255, 119, 0, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
              }}>
                <CardHeader>
                  <CardTitle style={{ color: 'white' }}>Stream Analytics</CardTitle>
                  <CardDescription style={{ color: 'white' }}>View your stream performance and audience</CardDescription>
                </CardHeader>
                <CardContent>
                  <p style={{ color: 'white' }}>Analytics content would go here.</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* OBS Guide Tab */}
            <TabsContent value="guide">
              <Card className="stream-card" style={{
                maxWidth: '800px',
                margin: '0 auto',
                background: 'linear-gradient(135deg, #121218, #1A1A20)',
                border: '1px solid rgba(255, 119, 0, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
              }}>
                <CardHeader>
                  <CardTitle style={{ color: 'white' }}>OBS Setup Guide</CardTitle>
                  <CardDescription style={{ color: 'white' }}>Learn how to set up your streaming software</CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="obs-guide">
                    <div className="stream-setup-step" style={{ 
                      background: 'linear-gradient(135deg, rgba(25, 25, 45, 0.7), rgba(20, 20, 30, 0.9))', 
                      borderRadius: '12px',
                      padding: '20px',
                      marginBottom: '20px',
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                      border: '1px solid rgba(255, 119, 0, 0.3)'
                    }}>
                      <div>
                        <h4 className="font-semibold" style={{ 
                          color: '#FF7700',
                          fontSize: '18px',
                          marginBottom: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <div style={{ 
                            background: 'linear-gradient(135deg, #FF7700, #FF5500)',
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold'
                          }}>1</div>
                          Connect to Clipt
                        </h4>
                        <p className="text-sm mt-1" style={{ color: 'white' }}>Follow these steps to connect OBS to Clipt:</p>
                        <div className="steps-container" style={{ color: 'white', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div className="step-item" style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ color: 'white' }}>Open OBS Studio and go to <strong>Settings</strong> → <strong>Stream</strong></span>
                          </div>
                          <div className="step-item" style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ color: 'white' }}>Select <strong>"Custom..."</strong> as the service</span>
                          </div>
                          <div className="step-item" style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ color: 'white' }}>For <strong>Server</strong>, enter: <code className="bg-black/20 px-1 rounded">{RTMP_URL}</code></span>
                          </div>
                          <div className="step-item" style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ color: 'white' }}>For <strong>Stream Key</strong>, enter: <code className="bg-black/20 px-1 rounded">{showKey ? STREAM_KEY : '●●●●●●●●●●●●●●●●●●●●'}</code></span>
                          </div>
                          <div className="step-item" style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ color: 'white' }}>Click <strong>Apply</strong> and then <strong>OK</strong></span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="stream-setup-step" style={{ 
                      background: 'linear-gradient(135deg, rgba(25, 25, 45, 0.7), rgba(20, 20, 30, 0.9))', 
                      borderRadius: '12px',
                      padding: '20px',
                      marginBottom: '20px',
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                      border: '1px solid rgba(255, 119, 0, 0.3)'
                    }}>
                      <div>
                        <h4 className="font-semibold" style={{ 
                          color: '#FF9A40',
                          fontSize: '18px',
                          marginBottom: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <div style={{ 
                            background: 'linear-gradient(135deg, #FF9A40, #FF7700)',
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold'
                          }}>2</div>
                          Configure Output Settings
                        </h4>
                        <p className="text-sm mt-1" style={{ color: 'white' }}>For optimal quality:</p>
                        <div className="steps-container" style={{ color: 'white', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div className="step-item" style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ color: 'white' }}>Go to <strong>Settings</strong> → <strong>Output</strong></span>
                          </div>
                          <div className="step-item" style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ color: 'white' }}>Set <strong>Output Mode</strong> to <strong>Advanced</strong></span>
                          </div>
                          <div className="step-item" style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ color: 'white' }}>Under the <strong>Streaming</strong> tab:</span>
                            <div style={{ marginLeft: '20px', marginTop: '8px', display: 'grid', gap: '6px', color: 'white' }}>
                              <div>• Encoder: x264 (or NVIDIA NVENC if available)</div>
                              <div>• Rate Control: CBR</div>
                              <div>• Bitrate: 6000 Kbps</div>
                              <div>• Keyframe Interval: 2</div>
                              <div>• CPU Usage Preset: Fast</div>
                              <div>• Profile: High</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="stream-setup-step" style={{ 
                      background: 'linear-gradient(135deg, rgba(25, 25, 45, 0.7), rgba(20, 20, 30, 0.9))', 
                      borderRadius: '12px',
                      padding: '20px',
                      marginBottom: '20px',
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                      border: '1px solid rgba(255, 119, 0, 0.3)'
                    }}>
                      <div>
                        <h4 className="font-semibold" style={{ 
                          color: '#FFAA00',
                          fontSize: '18px',
                          marginBottom: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <div style={{ 
                            background: 'linear-gradient(135deg, #FFAA00, #FF9A40)',
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold'
                          }}>3</div>
                          Start Streaming
                        </h4>
                        <div className="steps-container" style={{ color: 'white', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div className="step-item" style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ color: 'white' }}>You're all set! Click <strong>Start Streaming</strong> in OBS when you're ready to go live.</span>
                          </div>
                          <div className="step-item" style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ color: 'white' }}>Your stream will appear on your channel page automatically.</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter>
                  <p className="text-xs text-center w-full" style={{ color: 'white' }}>
                    Need more help? Check out our <a href="#" style={{ color: '#FF7700' }} className="hover:underline">detailed streaming guide</a> or <a href="#" style={{ color: '#FF7700' }} className="hover:underline">contact support</a>
                  </p>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
