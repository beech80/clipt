import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AccessibilitySettings } from "@/components/accessibility/AccessibilitySettings";
import { ControllerSettings } from '@/components/ControllerSettings';
import { TwoFactorSettings } from "@/components/settings/TwoFactorSettings";
import { DeviceStorageSettings } from "@/components/settings/DeviceStorageSettings";
import { DataPrivacySettings } from "@/components/settings/DataPrivacySettings";
import { PhotoSafetyNotices } from "@/components/settings/PhotoSafetyNotices";
import { CreatorSafetySettings } from '@/components/settings/CreatorSafetySettings';
import { StreamSettings } from "@/components/streaming/StreamSettings";
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
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { DatabaseProfile } from "@/types/profile";

const Settings = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { hash } = useLocation();
  const activeSection = hash || '#settings-account';
  const queryClient = useQueryClient();

  const { data: profile, isLoading, isError: profileError, refetch: refetchProfile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_own_profile')
        .single();

      if (error) throw error;
      
      return data;
    },
    enabled: !!user?.id
  });

  const { data: notificationPreferences, isLoading: notificationsLoading, isError: notificationsError, refetch: refetchNotifications } = useQuery({
    queryKey: ['notification-preferences', user?.id],
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
    if (!notificationPreferences || notificationsError || updateNotificationsMutation.isPending) return;
    updateNotificationsMutation.mutate({ [key]: value });
  };

  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: Pick<Partial<DatabaseProfile>, 'enable_notifications' | 'enable_sounds'>) => {
      if (!user) throw new Error('Sign in to update settings');
      const { data, error } = await supabase.from('profiles').update(settings).eq('id', user.id).select('id').single();
      if (error) throw error;
      if (!data) throw new Error('Settings were not saved');
    },
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['profile', user?.id] }); },
    onError: () => toast.error('Unable to save settings'),
  });

  const handleToggle = (setting: 'enable_notifications' | 'enable_sounds') => {
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
            aria-label="Back from settings"
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
    <div className="clipt-settings">
      <div className="container max-w-6xl mx-auto px-4 py-6 space-y-8">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                aria-label="Back from settings"
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

        <div className="clipt-settings-layout">
        <nav aria-label="Settings sections" className="clipt-settings-nav gaming-card">
          {[
            {id:'account',label:'Account',icon:UserCog},
            {id:'security',label:'Security / MFA',icon:Shield},
            {id:'privacy',label:'Privacy & account data',icon:Globe},
            {id:'photo-safety',label:'Photo safety notices',icon:Shield},
            {id:'notifications',label:'Notifications',icon:Bell},
            {id:'accessibility',label:'Accessibility',icon:Layout},
            {id:'storage',label:'Device storage',icon:HardDrive},
            {id:'stream',label:'Stream preferences',icon:Video},
            {id:'help',label:'Help & documentation',icon:BookOpen},
          ].map(({id,label,icon:Icon}) => <Link key={id} to={`#settings-${id}`} onClick={() => document.getElementById(`settings-${id}`)?.scrollIntoView({block:'start'})} aria-current={activeSection === `#settings-${id}` ? 'location' : undefined}><Icon aria-hidden="true" className="h-5 w-5 shrink-0" /><span>{label}</span></Link>)}
        </nav>
        <div className="grid gap-6 lg:grid-cols-2 min-w-0">
          <div className="space-y-6">
            <Card id="settings-account" className="p-6 gaming-card">
              <div className="clipt-account-heading flex items-center gap-2 mb-6">
                <UserCog className="w-5 h-5 text-purple-500" />
                <h2 className="text-xl font-semibold">Account Settings</h2>
              </div>
              <div className="space-y-4">
                {profileError && <div role="alert" className="space-y-2"><p>Unable to load account settings. Saved preferences have not been changed.</p><Button onClick={() => void refetchProfile()}>Retry account settings</Button></div>}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive email notifications about activity
                    </p>
                  </div>
                  <Switch
                    aria-label="Email Notifications"
                    disabled={!profile || updateSettingsMutation.isPending}
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
                    aria-label="Sound Effects"
                    disabled={!profile || updateSettingsMutation.isPending}
                    checked={profile?.enable_sounds}
                    onCheckedChange={() => handleToggle('enable_sounds')}
                  />
                </div>
                <Separator className="my-4" />
                <Button 
                  variant="default" 
                  onClick={() => navigate('/profile/edit')}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 mb-4"
                >
                  <UserCog className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
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

            <Card id="settings-help" className="p-6 gaming-card">
              <div className="flex items-center gap-2 mb-6">
                <BookOpen className="w-5 h-5 text-purple-500" />
                <h2 className="text-xl font-semibold">Documentation</h2>
              </div>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Read the preview user guide, including navigation, account security and current feature limitations.
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
                <p>Interface language: English</p>
                <p className="text-sm text-muted-foreground">
                  Additional translations and an account-wide time zone override are not available in this preview.
                  Token earning limits use server UTC days, independently of your device time zone.
                </p>
              </div>
            </Card>

            <section id="settings-security" aria-label="Security and MFA"><TwoFactorSettings /></section>
            <section id="settings-privacy" aria-label="Privacy and account data"><DataPrivacySettings /></section>
            <CreatorSafetySettings />
            <section id="settings-photo-safety" aria-label="Photo safety notices"><PhotoSafetyNotices /></section>
          </div>

          <div className="space-y-6">
            <section id="settings-storage" aria-label="Device storage"><DeviceStorageSettings /></section>
            <section id="settings-accessibility" aria-label="Accessibility"><AccessibilitySettings /></section>
            <Card className="p-6 space-y-4"><h2 className="text-xl font-semibold">Controller</h2><ControllerSettings /></Card>

            <Card id="settings-notifications" className="p-6 gaming-card">
              <div className="flex items-center gap-2 mb-6">
                <Bell className="w-5 h-5 text-purple-500" />
                <h2 className="text-xl font-semibold">Notification Preferences</h2>
              </div>
              <div className="space-y-6">
                {notificationsLoading && <p role="status">Loading notification preferences…</p>}
                {notificationsError && <div role="alert" className="space-y-2"><p>Unable to load notification preferences.</p><Button onClick={() => void refetchNotifications()}>Retry notification preferences</Button></div>}
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <Switch
                    id="email-notifications"
                    disabled={!notificationPreferences || notificationsError || updateNotificationsMutation.isPending}
                    checked={notificationPreferences?.email_notifications}
                    onCheckedChange={(checked) => handleNotificationToggle('email_notifications', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="push-notifications">Push Notifications</Label>
                  <Switch
                    id="push-notifications"
                    disabled={!notificationPreferences || notificationsError || updateNotificationsMutation.isPending}
                    checked={notificationPreferences?.push_notifications}
                    onCheckedChange={(checked) => handleNotificationToggle('push_notifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="stream-notifications">Stream Notifications</Label>
                  <Switch
                    id="stream-notifications"
                    disabled={!notificationPreferences || notificationsError || updateNotificationsMutation.isPending}
                    checked={notificationPreferences?.stream_notifications}
                    onCheckedChange={(checked) => handleNotificationToggle('stream_notifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="mention-notifications">Mention Notifications</Label>
                  <Switch
                    id="mention-notifications"
                    disabled={!notificationPreferences || notificationsError || updateNotificationsMutation.isPending}
                    checked={notificationPreferences?.mention_notifications}
                    onCheckedChange={(checked) => handleNotificationToggle('mention_notifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="follower-notifications">Follower Notifications</Label>
                  <Switch
                    id="follower-notifications"
                    disabled={!notificationPreferences || notificationsError || updateNotificationsMutation.isPending}
                    checked={notificationPreferences?.follower_notifications}
                    onCheckedChange={(checked) => handleNotificationToggle('follower_notifications', checked)}
                  />
                </div>
              </div>
            </Card>

            {user && <section id="settings-stream" aria-label="Stream preferences"><StreamSettings userId={user.id} /></section>}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
