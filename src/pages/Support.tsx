import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Support = () => {
  const { toast } = useToast();
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('support_tickets')
        .insert([{ title, description }]);

      if (error) throw error;

      toast({
        title: "Ticket submitted",
        description: "We'll get back to you as soon as possible.",
      });

      setTitle("");
      setDescription("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit ticket. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Support</h1>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Title
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What do you need help with?"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide details about your issue..."
              required
              rows={5}
            />
          </div>

          <Button type="submit">Submit Ticket</Button>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">FAQ</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">How do I start streaming?</h3>
            <p className="text-muted-foreground">
              Visit the Streaming page and click "Start Stream". You'll need to configure your
              streaming software with the provided stream key.
            </p>
          </div>
          <div>
            <h3 className="font-medium">How do I earn achievements?</h3>
            <p className="text-muted-foreground">
              Achievements are earned by participating in various activities like streaming,
              creating content, and engaging with the community.
            </p>
          </div>
          <div>
            <h3 className="font-medium">How do I report inappropriate content?</h3>
            <p className="text-muted-foreground">
              Each post and stream has a report button. Click it and fill out the form to
              report any content that violates our community guidelines.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Support;