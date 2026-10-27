import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { UserCog, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const EditProfile = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              aria-label="Back to my profile"
              onClick={() => navigate('/profile')}
              className="hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Profile Settings</h1>
              <p className="text-muted-foreground">
                Manage your account settings and preferences
              </p>
            </div>
          </div>
        </div>
        <Separator />
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Left Column */}
        <div className="space-y-6">
          <Card className="gaming-card p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-6">
              <UserCog className="w-5 h-5 text-purple-500" />
              <h2 className="text-xl font-semibold">Basic Information</h2>
            </div>
            <Tabs defaultValue="account">
              <TabsList className="mb-4 dark:bg-slate-800">
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="preferences">Preferences</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
              </TabsList>
              <TabsContent value="account">
                <ProfileEditForm />
              </TabsContent>
              <TabsContent value="preferences">
                <div className="space-y-4">
                  {/* Theme customization temporarily removed - will be added back in future update */}
                  <div className="rounded-md border dark:border-slate-800 p-4">
                    <h3 className="text-lg font-medium mb-2">Preferences</h3>
                    <Link to="/settings#settings-accessibility" className="inline-flex min-h-11 items-center text-purple-200 underline">Open accessibility and display preferences</Link>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="notifications">
                <Link to="/settings#settings-notifications" className="inline-flex min-h-11 items-center text-purple-200 underline">Open notification preferences</Link>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
