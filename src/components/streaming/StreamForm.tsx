import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

interface StreamFormProps {
  title: string;
  description: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
}

export const StreamForm = ({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
}: StreamFormProps) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Stream Settings</h3>
        <Button 
          variant="outline" 
          size="sm"
        >
          <Settings className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Stream Title</Label>
          <Input
            placeholder="My Awesome Stream"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Stream Description</Label>
          <Textarea
            placeholder="Tell viewers about your stream..."
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Enable Chat</Label>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <Label>Followers-only Chat</Label>
            <Switch />
          </div>

          <div className="space-y-2">
            <Label>Chat Slow Mode (seconds)</Label>
            <Input
              type="number"
              min="0"
              defaultValue="0"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Enable Stream Notifications</Label>
            <Switch defaultChecked />
          </div>
        </div>
      </div>
    </div>
  );
};