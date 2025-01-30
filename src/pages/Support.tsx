import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LifeBuoy, MessageSquare } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const Support = () => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user?.id,
          title,
          description
        });
      
      if (error) throw error;
      
      toast.success("Support ticket submitted successfully");
      setTitle("");
      setDescription("");
    } catch (error) {
      toast.error("Failed to submit support ticket");
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <LifeBuoy className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Help & Support</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Submit a Support Ticket</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-1">
                Title
              </label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief description of your issue"
                required
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1">
                Description
              </label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed explanation of your issue"
                required
                rows={5}
              />
            </div>
            <Button type="submit" className="w-full">
              <MessageSquare className="h-4 w-4 mr-2" />
              Submit Ticket
            </Button>
          </form>
        </Card>

        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-2">Quick Help</h3>
            <ul className="space-y-2 text-sm">
              <li>• Check our FAQ section</li>
              <li>• Read the user guide</li>
              <li>• Contact community moderators</li>
              <li>• Join our Discord community</li>
            </ul>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-2">Contact Information</h3>
            <div className="text-sm space-y-2">
              <p>Email: support@example.com</p>
              <p>Hours: Mon-Fri, 9am-5pm EST</p>
              <p>Response time: 24-48 hours</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Support;