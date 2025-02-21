import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ThemeSelector } from "@/components/profile/ThemeSelector";
import { AccessibilitySettings } from "@/components/accessibility/AccessibilitySettings";
import { TwoFactorSettings } from "@/components/settings/TwoFactorSettings";
import { DataPrivacySettings } from "@/components/settings/DataPrivacySettings";
import { StreamSettings } from "@/components/streaming/StreamSettings";
import GameBoyControls from "@/components/GameBoyControls";
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
import { Profile, CustomTheme, DatabaseProfile } from "@/types/profile";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Settings = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      
      const dbProfile = data as DatabaseProfile;
      const customTheme = dbProfile.custom_theme as CustomTheme || {
        primary: "#1EAEDB",
        secondary: "#1A1F2C"
      };

      return {
        ...dbProfile,
        custom_theme: customTheme
      } as Profile;
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

  const handleNotificationToggle = (key: string, value: boolean) => {
    updateNotificationsMutation.mutate({ [key]: value });
  };

  const handleToggle = (setting: keyof Profile) => {
    if (!profile) return;
    
    updateSettingsMutation.mutate({
      [setting]: !profile[setting]
    });
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
      <div className="container mx-auto py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(-1)}
            className="hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Loading your settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-[180px] sm:pb-[200px]">
      <div className="container mx-auto py-6 space-y-8">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate(-1)}
                className="hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-muted-foreground">
                  Manage your account settings and preferences
                </p>
              </div>
            </div>
          </div>
          <Separator />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <UserCog className="w-5 h-5 text-purple-500" />
                <h2 className="text-xl font-semibold">Account Settings</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive email notifications about activity
                    </p>
                  </div>
                  <Switch
                    checked={profile?.enable_notifications}
                    onCheckedChange={() => handleToggle('enable_notifications')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Sound Effects</Label>
                    <p className="text-sm text-muted-foreground">
                      Play sounds for interactions
                    </p>
                  </div>
                  <Switch
                    checked={profile?.enable_sounds}
                    onCheckedChange={() => handleToggle('enable_sounds')}
                  />
                </div>
                <Separator className="my-4" />
                <Button 
                  variant="destructive" 
                  onClick={handleSignOut}
                  className="w-full"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <BookOpen className="w-5 h-5 text-purple-500" />
                <h2 className="text-xl font-semibold">Documentation</h2>
              </div>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Access our comprehensive documentation, including user guides, API documentation, and community guidelines.
                </p>
                <Button 
                  onClick={() => navigate('/docs/user-guide')}
                  className="w-full"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  View Documentation
                </Button>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Globe className="w-5 h-5 text-purple-500" />
                <h2 className="text-xl font-semibold">Language & Region</h2>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select defaultValue="en">
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Time Zone</Label>
                  <Select defaultValue="utc">
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="utc">UTC (GMT)</SelectItem>
                      <SelectItem value="est">Eastern Time (ET)</SelectItem>
                      <SelectItem value="pst">Pacific Time (PT)</SelectItem>
                      <SelectItem value="cet">Central European Time (CET)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            <TwoFactorSettings />
            <DataPrivacySettings />
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Paintbrush className="w-5 h-5 text-purple-500" />
                <h2 className="text-xl font-semibold">Appearance</h2>
              </div>
              <ThemeSelector 
                userId={profile.id} 
                currentTheme={profile.custom_theme}
              />
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <HardDrive className="w-5 h-5 text-purple-500" />
                <h2 className="text-xl font-semibold">Storage & Downloads</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-Download Media</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically download media in chats
                    </p>
                  </div>
                  <Switch
                    checked={profile?.auto_download_media}
                    onCheckedChange={() => handleToggle('auto_download_media')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Storage Usage</Label>
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                    <div className="flex justify-between mb-2">
                      <span>Used Storage</span>
                      <span>2.1 GB / 5 GB</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                      <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full mt-2">
                    Clear Cache
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Gauge className="w-5 h-5 text-purple-500" />
                <h2 className="text-xl font-semibold">Performance</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Hardware Acceleration</Label>
                    <p className="text-sm text-muted-foreground">
                      Use GPU for better performance
                    </p>
                  </div>
                  <Switch
                    checked={profile?.hardware_acceleration}
                    onCheckedChange={() => handleToggle('hardware_acceleration')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Reduce Animations</Label>
                    <p className="text-sm text-muted-foreground">
                      Disable animations for better performance
                    </p>
                  </div>
                  <Switch
                    checked={profile?.reduce_animations}
                    onCheckedChange={() => handleToggle('reduce_animations')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Background Processing</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow processing when app is in background
                    </p>
                  </div>
                  <Switch
                    checked={profile?.background_processing}
                    onCheckedChange={() => handleToggle('background_processing')}
                  />
                </div>
              </div>
            </Card>

            <AccessibilitySettings />

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Bell className="w-5 h-5 text-purple-500" />
                <h2 className="text-xl font-semibold">Notification Preferences</h2>
              </div>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <Switch
                    id="email-notifications"
                    checked={notificationPreferences?.email_notifications}
                    onCheckedChange={(checked) => handleNotificationToggle('email_notifications', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="push-notifications">Push Notifications</Label>
                  <Switch
                    id="push-notifications"
                    checked={notificationPreferences?.push_notifications}
                    onCheckedChange={(checked) => handleNotificationToggle('push_notifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="stream-notifications">Stream Notifications</Label>
                  <Switch
                    id="stream-notifications"
                    checked={notificationPreferences?.stream_notifications}
                    onCheckedChange={(checked) => handleNotificationToggle('stream_notifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="mention-notifications">Mention Notifications</Label>
                  <Switch
                    id="mention-notifications"
                    checked={notificationPreferences?.mention_notifications}
                    onCheckedChange={(checked) => handleNotificationToggle('mention_notifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="follower-notifications">Follower Notifications</Label>
                  <Switch
                    id="follower-notifications"
                    checked={notificationPreferences?.follower_notifications}
                    onCheckedChange={(checked) => handleNotificationToggle('follower_notifications', checked)}
                  />
                </div>
              </div>
            </Card>

            {user && <StreamSettings userId={user.id} />}
          </div>
        </div>
      </div>
      <GameBoyControls />
    </div>
  );
};

export default Settings;
