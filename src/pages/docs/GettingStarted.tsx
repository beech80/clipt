
import { BookOpen, Code, Shield, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function GettingStarted() {
  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <BookOpen className="w-5 h-5 text-purple-500" />
        <h1 className="text-2xl font-bold">Getting Started with Clip</h1>
      </div>
      
      <Separator />
      
      <div className="grid gap-6">
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Welcome to Clip</h2>
          <p className="text-muted-foreground">
            Clip is your platform for sharing gaming moments, connecting with other gamers,
            and building your gaming community. This guide will help you get started with
            the basic features and settings.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Quick Start Guide</h2>
          <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
            <li>Create your account or sign in</li>
            <li>Complete your profile setup</li>
            <li>Follow some gamers and games you're interested in</li>
            <li>Explore the feed and discover content</li>
            <li>Share your first gaming moment</li>
          </ol>
        </section>

        <section className="grid md:grid-cols-2 gap-4">
          <Card className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-purple-500" />
              <h3 className="font-semibold">API Documentation</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Access our comprehensive API documentation for developers
            </p>
          </Card>
          
          <Card className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-500" />
              <h3 className="font-semibold">Community Guidelines</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Learn about our community standards and policies
            </p>
          </Card>
          
          <Card className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-500" />
              <h3 className="font-semibold">Join the Community</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Connect with other gamers and share experiences
            </p>
          </Card>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Key Features</h2>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
            <li>Share gameplay clips and highlights</li>
            <li>Live streaming capabilities</li>
            <li>Interactive chat and community features</li>
            <li>Achievement system</li>
            <li>Custom collections and playlists</li>
          </ul>
        </section>
      </div>
    </Card>
  );
}
