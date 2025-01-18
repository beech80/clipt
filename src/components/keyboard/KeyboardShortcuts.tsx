import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function KeyboardShortcuts() {
  const { user } = useAuth();
  const [shortcuts, setShortcuts] = useState<Array<{ action: string; shortcut: string }>>([]);

  useEffect(() => {
    if (user) {
      loadShortcuts();
    }
  }, [user]);

  const loadShortcuts = async () => {
    const { data, error } = await supabase
      .from("keyboard_shortcuts")
      .select("*")
      .eq("user_id", user?.id);

    if (error) {
      console.error("Error loading keyboard shortcuts:", error);
      return;
    }

    setShortcuts(data || []);
  };

  const updateShortcut = async (index: number, shortcut: string) => {
    const updatedShortcuts = [...shortcuts];
    updatedShortcuts[index].shortcut = shortcut;
    setShortcuts(updatedShortcuts);

    const { error } = await supabase
      .from("keyboard_shortcuts")
      .upsert({
        user_id: user?.id,
        action: updatedShortcuts[index].action,
        shortcut: shortcut,
      });

    if (error) {
      toast.error("Failed to update shortcut");
      return;
    }

    toast.success("Shortcut updated successfully");
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Keyboard Shortcuts</h2>
        <p className="text-muted-foreground">
          Customize your keyboard shortcuts
        </p>
      </div>

      <div className="space-y-4">
        {shortcuts.map((shortcut, index) => (
          <div key={index} className="flex items-center gap-4">
            <Label className="w-32">{shortcut.action}</Label>
            <Input
              value={shortcut.shortcut}
              onChange={(e) => updateShortcut(index, e.target.value)}
              placeholder="Press keys..."
              className="flex-1"
            />
          </div>
        ))}
      </div>

      <Button
        variant="outline"
        onClick={() => {
          setShortcuts([...shortcuts, { action: "", shortcut: "" }]);
        }}
      >
        Add Shortcut
      </Button>
    </Card>
  );
}