import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Twitter, Webhook, Bot, Plugin } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import DiscordConnect from '@/components/discord/DiscordConnect';

export default function Integrations() {
  const { user } = useAuth();
  const [webhookUrl, setWebhookUrl] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const handleWebhookSave = async () => {
    if (!webhookUrl) {
      toast.error('Please enter a webhook URL');
      return;
    }

    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('streaming_platforms')
        .upsert({
          user_id: user?.id,
          platform_name: 'webhook',
          platform_config: { webhook_url: webhookUrl },
          is_enabled: true
        });

      if (error) throw error;
      toast.success('Webhook URL saved successfully');
    } catch (error) {
      console.error('Error saving webhook:', error);
      toast.error('Failed to save webhook URL');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold mb-6">Platform Integrations</h1>
      
      <Tabs defaultValue="discord" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="discord" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Discord
          </TabsTrigger>
          <TabsTrigger value="twitter" className="flex items-center gap-2">
            <Twitter className="h-4 w-4" />
            Twitter/X
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="flex items-center gap-2">
            <Webhook className="h-4 w-4" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="chatbot" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Chatbot
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <Plugin className="h-4 w-4" />
            API
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discord">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Discord Integration</h2>
            <p className="text-muted-foreground mb-4">
              Connect your Discord account to enable enhanced features like role sync,
              chat bridging, and automated notifications.
            </p>
            <DiscordConnect />
          </Card>
        </TabsContent>

        <TabsContent value="twitter">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Twitter/X Integration</h2>
            <p className="text-muted-foreground mb-4">
              Automatically post updates about your streams to Twitter/X.
            </p>
            <Button 
              onClick={() => toast.info('Twitter integration coming soon')}
              variant="outline"
            >
              <Twitter className="h-4 w-4 mr-2" />
              Connect Twitter/X
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Custom Webhooks</h2>
            <p className="text-muted-foreground mb-4">
              Set up webhooks to integrate with your custom tools and services.
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Enter webhook URL"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
              />
              <Button 
                onClick={handleWebhookSave}
                disabled={isLoading}
              >
                Save Webhook
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="chatbot">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Custom Chatbot</h2>
            <p className="text-muted-foreground mb-4">
              Create and customize your own chatbot with custom commands and responses.
            </p>
            <Button 
              onClick={() => toast.info('Chatbot creation coming soon')}
              variant="outline"
            >
              Create Chatbot
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="api">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">API Access</h2>
            <p className="text-muted-foreground mb-4">
              Get API keys and documentation for integrating with third-party tools.
            </p>
            <div className="space-y-4">
              <Button 
                onClick={() => toast.info('API documentation coming soon')}
                variant="outline"
              >
                View API Documentation
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}