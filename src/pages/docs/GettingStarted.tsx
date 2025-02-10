
import { BookOpen, Code, Shield, Users, List, Check } from "lucide-react";
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
            Clip is your ultimate platform for capturing, sharing, and celebrating gaming moments. 
            Whether you're a casual player, content creator, or esports enthusiast, our platform 
            provides the tools you need to showcase your gaming journey and connect with a vibrant 
            community of fellow gamers.
          </p>
        </section>

        <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2">
              <List className="w-5 h-5 text-purple-500" />
              <h3 className="font-semibold">Record & Share</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Easily capture and share your epic gaming moments, from victory royales to speedrun records.
            </p>
          </Card>
          
          <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-500" />
              <h3 className="font-semibold">Build Community</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Connect with fellow gamers, join gaming groups, and participate in community events.
            </p>
          </Card>
          
          <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-500" />
              <h3 className="font-semibold">Stream Securely</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Stream your gameplay with advanced security features and quality controls.
            </p>
          </Card>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Quick Start Guide</h2>
          <div className="grid gap-4">
            <div className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent transition-colors">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-500 text-white">
                <Check className="w-4 h-4" />
              </span>
              <div className="space-y-1">
                <h3 className="font-medium">Create Your Account</h3>
                <p className="text-sm text-muted-foreground">
                  Sign up with your email or connect with your existing gaming accounts to get started.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent transition-colors">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-500 text-white">
                <Check className="w-4 h-4" />
              </span>
              <div className="space-y-1">
                <h3 className="font-medium">Set Up Your Profile</h3>
                <p className="text-sm text-muted-foreground">
                  Customize your profile with your gaming interests, achievements, and favorite games.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent transition-colors">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-500 text-white">
                <Check className="w-4 h-4" />
              </span>
              <div className="space-y-1">
                <h3 className="font-medium">Start Creating</h3>
                <p className="text-sm text-muted-foreground">
                  Record your first gaming clip or start a live stream to share your gameplay with the world.
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
