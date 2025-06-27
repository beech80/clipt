import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, BarChart2, Settings, Check, Clock, AlertTriangle } from 'lucide-react';
import NotificationRateLimitSettings from '@/components/NotificationRateLimitSettings';
import NotificationAnalyticsDashboard from '@/components/NotificationAnalyticsDashboard';
import BrowserCompatibilityTester from '@/components/BrowserCompatibilityTester';
import PushNotificationTest from '@/components/PushNotificationTest';
import NotificationSoftPrompt from '@/components/NotificationSoftPrompt';
import { useUser } from '@/hooks/useUser';

const NotificationCenter: React.FC = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('settings');
  const [showSoftPrompt, setShowSoftPrompt] = useState(false);
  
  // Don't render until we have a user
  if (!user) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center">
        <p>Please sign in to access notification settings</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 space-y-6">
      <h1 className="text-3xl font-bold">Notification Center</h1>
      <p className="text-muted-foreground">
        Manage all your notification settings, test functionality, and control delivery frequency
      </p>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b">
          <div className="container flex-col sm:flex-row flex items-start sm:items-center justify-between py-4 gap-4">
            <TabsList className="grid w-full sm:w-auto grid-cols-2 sm:grid-cols-4 gap-2">
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
              <TabsTrigger value="test" className="flex items-center gap-2">
                <Check className="h-4 w-4" />
                <span className="hidden sm:inline">Test</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="compatibility" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="hidden sm:inline">Compatibility</span>
              </TabsTrigger>
            </TabsList>
            
            <Button 
              variant="outline" 
              className="flex items-center gap-2" 
              onClick={() => setShowSoftPrompt(true)}
            >
              <Bell className="h-4 w-4" />
              Enable Notifications
            </Button>
          </div>
        </div>
        
        <div className="container py-6">
          <TabsContent value="settings" className="space-y-6 mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Standard notification settings */}
              <PushNotificationTest />
              
              {/* Rate limiting settings */}
              <NotificationRateLimitSettings />
            </div>
            
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Scheduled Notifications</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <p className="font-medium">Daily Activity Digest</p>
                    <p className="text-sm text-muted-foreground">
                      Receive a summary of all activity at the end of each day
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">9:00 PM</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <p className="font-medium">Weekly Stats Recap</p>
                    <p className="text-sm text-muted-foreground">
                      Get a weekly summary of your channel performance
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Sunday, 10:00 AM</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Stream Reminders</p>
                    <p className="text-sm text-muted-foreground">
                      Get notified 15 minutes before scheduled streams
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">15 min before</span>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="test" className="mt-0">
            <PushNotificationTest showAdvanced={true} />
          </TabsContent>
          
          <TabsContent value="analytics" className="mt-0">
            <NotificationAnalyticsDashboard />
          </TabsContent>
          
          <TabsContent value="compatibility" className="mt-0">
            <BrowserCompatibilityTester />
          </TabsContent>
        </div>
      </Tabs>
      
      {showSoftPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="max-w-md w-full">
            <NotificationSoftPrompt 
              type="general" 
              onClose={() => setShowSoftPrompt(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
