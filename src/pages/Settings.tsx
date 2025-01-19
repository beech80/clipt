import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataPrivacySettings } from "@/components/settings/DataPrivacySettings";
import { TwoFactorSettings } from "@/components/settings/TwoFactorSettings";
import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { ThemeSelector } from "@/components/profile/ThemeSelector";
import { AccessibilitySettings } from "@/components/accessibility/AccessibilitySettings";
import { KeyboardShortcuts } from "@/components/keyboard/KeyboardShortcuts";
import { useAuth } from "@/contexts/AuthContext";

const Settings = () => {
  const { user } = useAuth();
  const currentTheme = {
    primary: "#1EAEDB",
    secondary: "#000000"
  };

  if (!user) return null;

  return (
    <div className="container mx-auto py-6 space-y-8">
      <h1 className="text-3xl font-bold">Settings</h1>
      
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <ProfileEditForm />
          <ThemeSelector userId={user.id} currentTheme={currentTheme} />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <TwoFactorSettings />
          <KeyboardShortcuts />
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <DataPrivacySettings />
        </TabsContent>

        <TabsContent value="accessibility" className="space-y-6">
          <AccessibilitySettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;