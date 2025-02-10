
import { BookOpen, Code, Shield, Users, Gamepad, Video, MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

export default function GettingStarted() {
  return (
    <Card className="p-6 space-y-8">
      <div className="flex items-center gap-2">
        <BookOpen className="w-6 h-6 text-purple-500" />
        <h1 className="text-3xl font-bold">Getting Started with Clip</h1>
      </div>
      
      <Separator />
      
      <div className="grid gap-8">
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Welcome to Clip</h2>
          <p className="text-muted-foreground leading-relaxed">
            Clip is your ultimate platform for sharing gaming moments, connecting with fellow gamers,
            and building your gaming community. Whether you're a casual player or a content creator,
            our platform provides all the tools you need to capture, share, and celebrate your gaming journey.
          </p>
        </section>

        <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2">
              <Video className="w-5 h-5 text-purple-500" />
              <h3 className="font-semibold">Share Gaming Moments</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Upload and share your favorite gaming clips, highlights, and memorable moments with the community.
            </p>
          </Card>
          
          <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2">
              <Gamepad className="w-5 h-5 text-purple-500" />
              <h3 className="font-semibold">Game Integration</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Connect your gaming accounts and automatically sync your achievements and stats.
            </p>
          </Card>
          
          <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-500" />
              <h3 className="font-semibold">Community Features</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Engage with other gamers through comments, direct messages, and group discussions.
            </p>
          </Card>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Quick Start Guide</h2>
          <div className="grid gap-4">
            <div className="flex items-start gap-4 p-4 rounded-lg border bg-card">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-500 text-white">1</span>
              <div className="space-y-1">
                <h3 className="font-medium">Create Your Account</h3>
                <p className="text-sm text-muted-foreground">
                  Sign up with your email or connect with your gaming accounts to get started.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 rounded-lg border bg-card">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-500 text-white">2</span>
              <div className="space-y-1">
                <h3 className="font-medium">Complete Your Profile</h3>
                <p className="text-sm text-muted-foreground">
                  Add your gaming interests, preferred platforms, and customize your profile.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 rounded-lg border bg-card">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-500 text-white">3</span>
              <div className="space-y-1">
                <h3 className="font-medium">Start Sharing</h3>
                <p className="text-sm text-muted-foreground">
                  Upload your first gaming clip or start exploring content from other gamers.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-6">
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Code className="w-5 h-5 text-purple-500" />
              <h3 className="font-semibold">Developer Resources</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Access our comprehensive API documentation and developer tools to build integrations.
            </p>
            <Button variant="outline" className="w-full">View Documentation</Button>
          </Card>
          
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-500" />
              <h3 className="font-semibold">Community Guidelines</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Learn about our community standards and policies to ensure a positive gaming environment.
            </p>
            <Button variant="outline" className="w-full">Read Guidelines</Button>
          </Card>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Need Help?</h2>
          <p className="text-muted-foreground">
            Our support team is here to help you get the most out of Clip. Check out our help center
            or reach out to us directly through the support portal.
          </p>
          <Button className="gap-2">
            <Users className="w-4 h-4" />
            Contact Support
          </Button>
        </section>
      </div>
    </Card>
  );
}
