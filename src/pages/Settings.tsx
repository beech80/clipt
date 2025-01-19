import { AuthGuard } from '@/components/AuthGuard';
import { TwoFactorSettings } from '@/components/settings/TwoFactorSettings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Shield } from 'lucide-react';

const Settings = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    username: '',
    display_name: '',
    bio: '',
    email_notifications: false,
    push_notifications: false,
    dark_mode: false,
    is_verified: false,
    verification_requested_at: null as string | null
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      getProfile();
    }
  }, [user]);

  const getProfile = async () => {
    try {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (error) throw error;
      if (data) {
        setProfile({
          ...profile,
          ...data
        });
      }
    } catch (error) {
      toast.error('Error loading profile');
    }
  };

  const updateProfile = async () => {
    try {
      setLoading(true);
      if (!user) throw new Error('No user');

      const updates = {
        id: user.id,
        username: profile.username,
        display_name: profile.display_name,
        bio: profile.bio,
        email_notifications: profile.email_notifications,
        push_notifications: profile.push_notifications,
        dark_mode: profile.dark_mode,
        updated_at: new Date()
      };

      const { error } = await supabase.from('profiles').upsert(updates);
      if (error) throw error;
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  const requestVerification = async () => {
    try {
      setLoading(true);
      if (!user) throw new Error('No user');

      const { error } = await supabase
        .from('verification_requests')
        .insert([{ user_id: user.id }]);

      if (error) throw error;

      await supabase
        .from('profiles')
        .update({ verification_requested_at: new Date().toISOString() })
        .eq('id', user.id);

      setProfile(prev => ({
        ...prev,
        verification_requested_at: new Date().toISOString()
      }));

      toast.success('Verification request submitted successfully');
    } catch (error) {
      toast.error('Error submitting verification request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>
        <div className="space-y-6">
          <Tabs defaultValue="profile" className="w-full">
            <TabsList>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Settings</CardTitle>
                  <CardDescription>
                    Manage your public profile information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={profile.username}
                      onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="display_name">Display Name</Label>
                    <Input
                      id="display_name"
                      value={profile.display_name}
                      onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Input
                      id="bio"
                      value={profile.bio}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    />
                  </div>
                  <Button onClick={updateProfile} disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Choose how you want to receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div>Email Notifications</div>
                      <div className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </div>
                    </div>
                    <Switch
                      checked={profile.email_notifications}
                      onCheckedChange={(checked) => setProfile({ ...profile, email_notifications: checked })}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div>Push Notifications</div>
                      <div className="text-sm text-muted-foreground">
                        Receive push notifications
                      </div>
                    </div>
                    <Switch
                      checked={profile.push_notifications}
                      onCheckedChange={(checked) => setProfile({ ...profile, push_notifications: checked })}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <div className="space-y-6">
                <TwoFactorSettings />
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Account Verification
                    </CardTitle>
                    <CardDescription>
                      Get verified to unlock additional features and build trust with other users
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {profile.is_verified ? (
                      <div className="flex items-center gap-2 text-green-500">
                        <Shield className="h-5 w-5" />
                        Your account is verified
                      </div>
                    ) : profile.verification_requested_at ? (
                      <div className="text-muted-foreground">
                        Verification request pending. Submitted on {new Date(profile.verification_requested_at).toLocaleDateString()}
                      </div>
                    ) : (
                      <Button onClick={requestVerification} disabled={loading}>
                        Request Verification
                      </Button>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Password</CardTitle>
                    <CardDescription>
                      Change your password or enable two-factor authentication
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" onClick={() => window.location.href = '/reset-password'}>
                      Change Password
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <CardTitle>Account Preferences</CardTitle>
                  <CardDescription>
                    Manage your account settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div>Dark Mode</div>
                      <div className="text-sm text-muted-foreground">
                        Toggle dark mode theme
                      </div>
                    </div>
                    <Switch
                      checked={profile.dark_mode}
                      onCheckedChange={(checked) => setProfile({ ...profile, dark_mode: checked })}
                    />
                  </div>
                  <Separator />
                  <div className="pt-4">
                    <Button variant="destructive">Delete Account</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AuthGuard>
  );
};

export default Settings;