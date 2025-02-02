import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Video, Star } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface HighlightGeneratorProps {
  streamId: string;
  onHighlightGenerated: (highlightUrl: string) => void;
}

export const HighlightGenerator = ({ streamId, onHighlightGenerated }: HighlightGeneratorProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const generateHighlight = async () => {
    if (!title) {
      toast.error("Please enter a title for your highlight");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase
        .from('stream_highlights')
        .insert({
          stream_id: streamId,
          title,
          description,
          start_time: '00:00:00',
          duration: '00:05:00'
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Highlight generated successfully!");
      if (data?.highlight_url) {
        onHighlightGenerated(data.highlight_url);
      }
    } catch (error) {
      console.error('Error generating highlight:', error);
      toast.error("Failed to generate highlight");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Star className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Highlight Generator</h3>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Input
            placeholder="Highlight title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Textarea
            placeholder="Highlight description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <Button 
          onClick={generateHighlight} 
          disabled={isGenerating}
          className="w-full"
        >
          <Video className="h-4 w-4 mr-2" />
          {isGenerating ? "Generating..." : "Generate Highlight"}
        </Button>
      </div>
    </Card>
  );
};