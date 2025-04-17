import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AccessibilitySettings } from "@/components/accessibility/AccessibilitySettings";
import { TwoFactorSettings } from "@/components/settings/TwoFactorSettings";
import { DataPrivacySettings } from "@/components/settings/DataPrivacySettings";
import { StreamSettings } from "@/components/streaming/StreamSettings";
import { usePerformanceSettings } from "@/hooks/usePerformanceSettings";
import { useAuthSecurity } from "@/hooks/useAuthSecurity";
import {
  Bell,
  Volume2,
  Moon,
  Paintbrush,
  Shield,
  UserCog,
  ArrowLeft,
  Settings as SettingsIcon,
  Layout,
  MessageSquare,
  Globe,
  Video,
  BookOpen,
  LogOut,
  HardDrive,
  Gauge
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Profile, DatabaseProfile } from "@/types/profile";

// Add animation keyframes to global style
import { createGlobalStyle } from "styled-components";

const GlobalStyle = createGlobalStyle`
  @keyframes gearSpin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;


// Create an interface for our settings that includes all the properties we need
interface SettingsProfile extends Partial<Profile> {
  // Account & Security
  enable_2fa?: boolean;
  contact_verified?: boolean;
  
  // Storage
  auto_download_media?: boolean;
  
  // Performance
  hardware_acceleration?: boolean;
  reduce_animations?: boolean;
  background_processing?: boolean;
  
  // Video Settings
  default_video_quality?: string;
  autoplay_videos?: boolean;
  dark_mode?: boolean;
  captions_enabled?: boolean;
  default_video_speed?: string;
  
  // Accessibility
  high_contrast?: boolean;
  
  // Stream Settings
  enable_chat?: boolean;
  followers_only_chat?: boolean;
  slow_mode?: boolean;
  
  // Moderation
  profanity_filter?: boolean;
  auto_ban_spam?: boolean;
}
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Settings = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Define performance settings state directly in the component
  const [hardwareAcceleration, setHardwareAcceleration] = useState(() => {
    return localStorage.getItem('hardware-acceleration') !== 'disabled';
  });
  
  const [reduceAnimations, setReduceAnimations] = useState(() => {
    return localStorage.getItem('reduce-animations') === 'enabled';
  });
  
  const [backgroundProcessing, setBackgroundProcessing] = useState(() => {
    return localStorage.getItem('background-processing') !== 'disabled';
  });
  
  // Apply settings when component mounts
  useEffect(() => {
    // Apply hardware acceleration
    if (hardwareAcceleration) {
      document.body.classList.add('hardware-accelerated');
    } else {
      document.body.classList.remove('hardware-accelerated');
    }
    
    // Apply animation reduction
    if (reduceAnimations) {
      document.body.classList.add('reduce-animations');
    } else {
      document.body.classList.remove('reduce-animations');
    }
    
    // Apply background processing
    if (backgroundProcessing && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/background-worker.js').catch(err => {
        console.error('Error registering service worker:', err);
      });
    }
  }, []);
  
  // Create our own toggle functions right here
  const toggleHardwareAcceleration = (enabled) => {
    setHardwareAcceleration(enabled);
    localStorage.setItem('hardware-acceleration', enabled ? 'enabled' : 'disabled');
    
    if (enabled) {
      document.body.classList.add('hardware-accelerated');
    } else {
      document.body.classList.remove('hardware-accelerated');
    }
    
    toast.success(`Hardware acceleration ${enabled ? 'enabled' : 'disabled'}`);
  };
  
  const toggleReduceAnimations = (enabled) => {
    setReduceAnimations(enabled);
    localStorage.setItem('reduce-animations', enabled ? 'enabled' : 'disabled');
    
    if (enabled) {
      document.body.classList.add('reduce-animations');
    } else {
      document.body.classList.remove('reduce-animations');
    }
    
    toast.success(`Animations ${enabled ? 'reduced' : 'enabled'}`);
  };
  
  const toggleBackgroundProcessing = (enabled) => {
    setBackgroundProcessing(enabled);
    localStorage.setItem('background-processing', enabled ? 'enabled' : 'disabled');
    
    if (enabled && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/background-worker.js').catch(err => {
        console.error('Error registering service worker:', err);
      });
      toast.success('Background processing enabled');
    } else if (!enabled && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        for (const registration of registrations) {
          if (registration.scope.includes('background-worker')) {
            registration.unregister();
          }
        }
      });
      toast.success('Background processing disabled');
    }
  };

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      
      // Create default values for new settings properties
      return {
        ...data,
        enable_2fa: false,
        contact_verified: false,
        auto_download_media: true,
        hardware_acceleration: true,
        reduce_animations: false,
        background_processing: true,
        default_video_quality: "auto",
        autoplay_videos: true,
        dark_mode: true,
        captions_enabled: false,
        default_video_speed: "normal",
        profanity_filter: true,
        auto_ban_spam: true,
        high_contrast: false,
        enable_chat: true,
        followers_only_chat: false,
        slow_mode: false
      } as unknown as SettingsProfile;
    },
    enabled: !!user?.id
  });

  const { data: notificationPreferences } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (!data) {
        return {
          email_notifications: true,
          push_notifications: true,
          stream_notifications: true,
          mention_notifications: true,
          follower_notifications: true
        };
      }
      
      return data;
    },
    enabled: !!user?.id
  });

  const updateNotificationsMutation = useMutation({
    mutationFn: async (preferences: Partial<typeof notificationPreferences>) => {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user?.id,
          ...preferences,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      toast.success('Notification preferences updated');
    },
    onError: () => {
      toast.error('Failed to update notification preferences');
    }
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      toast.success('Settings updated successfully');
    },
    onError: () => {
      toast.error('Failed to update settings');
    }
  });

  const handleNotificationToggle = (key: string, value: boolean) => {
    updateNotificationsMutation.mutate({ [key]: value });
  };

  const handleToggle = async (setting: keyof SettingsProfile) => {
    if (!profile) return;
    
    // Use our direct toggle functions for performance settings
    if (setting === 'hardware_acceleration') {
      toggleHardwareAcceleration(!hardwareAcceleration);
      return;
    } else if (setting === 'reduce_animations') {
      toggleReduceAnimations(!reduceAnimations);
      return;
    } else if (setting === 'background_processing') {
      toggleBackgroundProcessing(!backgroundProcessing);
      return;
    }
    
    // For other settings, use the default behavior
    const updatedProfile = { ...profile, [setting]: !profile[setting] };
    updateSettingsMutation.mutate(updatedProfile as Profile);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-full" style={{ background: '#d7cbb9', minHeight: '100vh' }}>
        <div className="w-full">
          <div className="p-6 mb-6 border-b border-gray-300" style={{ background: '#cfc0a5' }}>
            <div className="container mx-auto">
              <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
              <p className="text-gray-600">Loading your settings...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-0 w-full" style={{ background: '#121212', minHeight: '100vh', overflowX: 'hidden' }}>
      <GlobalStyle />
      <div className="w-full h-full" style={{ maxWidth: '100%', padding: '0' }}>
        <div className="relative overflow-hidden w-full" style={{ 
          background: 'linear-gradient(135deg, #FF5500, #FF7700)',
          padding: '40px 0 30px',
          marginBottom: '20px',
          width: '100%',
          textAlign: 'center'
        }}>
          {/* Animation styles added to component */}
          
          <div className="flex flex-col items-center justify-center relative z-10 gap-3">
            <div style={{ 
              background: 'linear-gradient(135deg, #2A1A12, #1A0A02)', 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
              border: '3px solid rgba(255, 119, 0, 0.5)',
              marginBottom: '10px'
            }}>
              <div style={{
                animation: 'gearSpin 10s linear infinite',
                transformOrigin: 'center',
                display: 'inline-block'
              }} className="gear-spin">
                <SettingsIcon size={40} color="white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white" style={{ 
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
              letterSpacing: '1px'
            }}>SETTINGS</h1>
          </div>
          
          {/* Background decorations */}
          <div style={{ 
            position: 'absolute', 
            right: '5%', 
            top: '10%',
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,119,0,0.15) 0%, rgba(255,119,0,0) 70%)',
            zIndex: 1
          }}></div>
          <div style={{ 
            position: 'absolute', 
            left: '5%', 
            bottom: '10%',
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)',
            zIndex: 1
          }}></div>
        </div>

        <div className="px-4 py-6 w-full" style={{ maxWidth: '100%' }}>
          <div className="grid grid-cols-1 gap-6 w-full" style={{ padding: '0 0 80px 0' }}>
            {/* 🔐 Security & Account */}
            <Card className="p-6 w-full" style={{ 
              background: '#2A1A12', 
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              border: '1px solid #3A2A22',
              position: 'relative',
              overflow: 'hidden',
              width: '100%',
              color: 'white'           
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '4px',
                background: 'linear-gradient(90deg, #FF5500, #FF7700)',
              }}></div>
              <div className="flex items-center gap-3 mb-6">
                <div style={{ 
                  background: 'linear-gradient(135deg, #FF7700, #FF5500)', 
                  width: '36px', 
                  height: '36px', 
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(37, 99, 235, 0.2)'
                }}>
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-white">Security & Account</h2>
              </div>
              <div className="space-y-4 relative">
                <div style={{
                  position: 'absolute',
                  right: '-10px',
                  bottom: '-10px',
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(255, 119, 0, 0.1) 0%, rgba(255, 119, 0, 0) 70%)',
                  zIndex: 0
                }}></div>
                <div className="flex items-center justify-between relative z-10 hover:bg-white/10 p-2 rounded-lg transition-colors duration-200">
                  <div className="space-y-0.5">
                    <Label className="text-white">Two-Factor Authentication (2FA)</Label>
                    <p className="text-sm text-gray-400">
                      Secure your account with additional verification
                    </p>
                  </div>
                  <Switch
                    checked={profile?.enable_2fa}
                    onCheckedChange={() => handleToggle('enable_2fa')}
                    className="orange-toggle"
                  />
                </div>
                <div className="flex items-center justify-between relative z-10 hover:bg-white/10 p-2 rounded-lg transition-colors duration-200">
                  <div className="space-y-0.5">
                    <Label className="text-white">Email & Phone Verification</Label>
                    <p className="text-sm text-gray-400">
                      Verify your contact methods for security
                    </p>
                  </div>
                  <Switch
                    checked={profile?.contact_verified}
                    onCheckedChange={() => handleToggle('contact_verified')}
                    className="orange-toggle"
                  />
                </div>
                <Separator className="my-2" />
                <div className="grid grid-cols-1 gap-4 mt-6 pt-4 border-t border-gray-200">
                  <Button
                    className="w-full transition-all duration-200 hover:scale-105" 
                    variant="outline"
                    onClick={handleSignOut}
                    style={{
                      background: 'linear-gradient(135deg, #FF3A00, #FF5500)',
                      borderColor: '#FF7700',
                      color: 'white',
                      fontWeight: 'bold',
                      boxShadow: '0 2px 4px rgba(239, 68, 68, 0.15)'
                    }}
                  >
                    <LogOut className="w-4 h-4 mr-2 text-red-600" /> Sign Out
                  </Button>
                
                  <Button
                    className="w-full transition-all duration-200 hover:scale-105" 
                    variant="outline"
                    style={{
                      background: 'linear-gradient(135deg, #3A2A22, #2A1A12)',
                      borderColor: '#FF7700',
                      color: 'white',
                      fontWeight: '500',
                      boxShadow: '0 2px 4px rgba(37, 99, 235, 0.15)'
                    }}
                  >
                    <HardDrive className="w-4 h-4 mr-2 text-blue-600" /> Export User Data
                  </Button>
                </div>
              </div>
            </Card>

            {/* 🔔 Notifications */}
            <Card className="p-6 w-full" style={{ 
              background: '#2A1A12', 
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              border: '1px solid #3A2A22',
              position: 'relative',
              overflow: 'hidden',
              width: '100%',
              color: 'white'           
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '4px',
                background: 'linear-gradient(90deg, #FF5500, #FF7700)',
              }}></div>
              <div className="flex items-center gap-3 mb-6">
                <div style={{ 
                  background: 'linear-gradient(135deg, #FF7700, #FF5500)', 
                  width: '36px', 
                  height: '36px', 
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(219, 39, 119, 0.2)'
                }}>
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-white">Notifications</h2>
              </div>
              <div className="space-y-4 relative">
                <div style={{
                  position: 'absolute',
                  right: '-10px',
                  bottom: '-10px',
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(255, 119, 0, 0.1) 0%, rgba(255, 119, 0, 0) 70%)',
                  zIndex: 0
                }}></div>
                <div className="flex items-center justify-between relative z-10 hover:bg-white/10 p-2 rounded-lg transition-colors duration-200">
                  <div className="space-y-0.5">
                    <Label className="text-white">Email Notifications</Label>
                    <p className="text-sm text-gray-400">
                      Receive important updates via email
                    </p>
                  </div>
                  <Switch
                    checked={notificationPreferences?.email_notifications}
                    onCheckedChange={(checked) => handleNotificationToggle('email_notifications', checked)}
                    className="orange-toggle"
                  />
                </div>
                <div className="flex items-center justify-between relative z-10 hover:bg-white/10 p-2 rounded-lg transition-colors duration-200">
                  <div className="space-y-0.5">
                    <Label className="text-white">Push Notifications</Label>
                    <p className="text-sm text-gray-400">
                      Receive real-time alerts on your device
                    </p>
                  </div>
                  <Switch
                    checked={notificationPreferences?.push_notifications}
                    onCheckedChange={(checked) => handleNotificationToggle('push_notifications', checked)}
                    className="orange-toggle"
                  />
                </div>
                <div className="flex items-center justify-between relative z-10 hover:bg-white/10 p-2 rounded-lg transition-colors duration-200">
                  <div className="space-y-0.5">
                    <Label className="text-white">Stream Alerts</Label>
                    <p className="text-sm text-gray-400">
                      Get notified when streamers go live
                    </p>
                  </div>
                  <Switch
                    checked={notificationPreferences?.stream_notifications}
                    onCheckedChange={(checked) => handleNotificationToggle('stream_notifications', checked)}
                    className="orange-toggle"
                  />
                </div>
              </div>
            </Card>
            
            {/* 🧠 Performance */}
            <Card className="p-6 w-full" style={{ 
              background: '#2A1A12', 
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              border: '1px solid #3A2A22',
              position: 'relative',
              overflow: 'hidden',
              width: '100%',
              color: 'white'           
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '4px',
                background: 'linear-gradient(90deg, #FF5500, #FF7700)',
              }}></div>
              <div className="flex items-center gap-3 mb-6">
                <div style={{ 
                  background: 'linear-gradient(135deg, #FF7700, #FF5500)', 
                  width: '36px', 
                  height: '36px', 
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(16, 185, 129, 0.2)'
                }}>
                  <Gauge className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-white">Performance</h2>
              </div>
              <div className="space-y-4 relative">
                <div style={{
                  position: 'absolute',
                  right: '-10px',
                  bottom: '-10px',
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(255, 119, 0, 0.1) 0%, rgba(255, 119, 0, 0) 70%)',
                  zIndex: 0
                }}></div>
                <div className="flex items-center justify-between relative z-10 hover:bg-white/10 p-2 rounded-lg transition-colors duration-200">
                  <div className="space-y-0.5">
                    <Label className="text-white">Hardware Acceleration</Label>
                    <p className="text-sm text-gray-400">
                      Use GPU for better performance
                    </p>
                  </div>
                  <Switch
                    checked={hardwareAcceleration}
                    onCheckedChange={() => toggleHardwareAcceleration(!hardwareAcceleration)}
                    className="orange-toggle"
                  />
                </div>
                <div className="flex items-center justify-between relative z-10 hover:bg-white/10 p-2 rounded-lg transition-colors duration-200">
                  <div className="space-y-0.5">
                    <Label className="text-white">Reduce Animations</Label>
                    <p className="text-sm text-gray-400">
                      Disable animations for better performance
                    </p>
                  </div>
                  <Switch
                    checked={reduceAnimations}
                    onCheckedChange={() => toggleReduceAnimations(!reduceAnimations)}
                    className="orange-toggle"
                  />
                </div>
                <div className="flex items-center justify-between relative z-10 hover:bg-white/10 p-2 rounded-lg transition-colors duration-200">
                  <div className="space-y-0.5">
                    <Label className="text-white">Background Processing</Label>
                    <p className="text-sm text-gray-400">
                      Allow processing when app is in background
                    </p>
                  </div>
                  <Switch
                    checked={backgroundProcessing}
                    onCheckedChange={() => toggleBackgroundProcessing(!backgroundProcessing)}
                    className="orange-toggle"
                  />
                </div>

                <div className="flex items-center justify-between relative z-10 hover:bg-white/10 p-2 rounded-lg transition-colors duration-200">
                  <Label htmlFor="follower-notifications">Follower Notifications</Label>
                  <Switch
                    id="follower-notifications"
                    checked={notificationPreferences?.follower_notifications}
                    onCheckedChange={(checked) => handleNotificationToggle('follower_notifications', checked)}
                    className="orange-toggle"
                  />
                </div>
              </div>
            </Card>

            {user && <StreamSettings userId={user.id} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
