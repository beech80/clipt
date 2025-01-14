import { useState } from "react";
import { Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface StreamControlsProps {
  userId: string;
  onStreamUpdate: (data: { isLive: boolean; streamKey: string | null }) => void;
}

export const StreamControls = ({ userId, onStreamUpdate }: StreamControlsProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleStartStream = async () => {
    if (!title) {
      toast.error("Please set a stream title first");
      return;
    }

    setIsLoading(true);
    try {
      const { data: existingStream } = await supabase
        .from("streams")
        .select("id, stream_key")
        .eq("user_id", userId)
        .maybeSingle();

      if (existingStream) {
        const { error } = await supabase
          .from("streams")
          .update({
            title,
            description,
            is_live: true,
            started_at: new Date().toISOString(),
          })
          .eq("id", existingStream.id);

        if (error) throw error;
        onStreamUpdate({ isLive: true, streamKey: existingStream.stream_key });
      } else {
        // Let the database trigger handle stream_key generation
        const { data, error } = await supabase
          .from("streams")
          .insert({
            user_id: userId,
            title,
            description,
            is_live: true,
            started_at: new Date().toISOString(),
            stream_key: await generateStreamKey(),
          })
          .select()
          .single();

        if (error) throw error;
        onStreamUpdate({ isLive: true, streamKey: data.stream_key });
      }

      toast.success("Stream started successfully!");
    } catch (error) {
      console.error("Error starting stream:", error);
      toast.error("Failed to start stream");
    } finally {
      setIsLoading(false);
    }
  };

  const generateStreamKey = async () => {
    const { data, error } = await supabase.rpc('generate_stream_key');
    if (error) throw error;
    return data;
  };

  const handleEndStream = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("streams")
        .update({
          is_live: false,
          ended_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (error) throw error;
      onStreamUpdate({ isLive: false, streamKey: null });
      toast.success("Stream ended successfully!");
    } catch (error) {
      console.error("Error ending stream:", error);
      toast.error("Failed to end stream");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 mb-6">
      <div>
        <Input
          placeholder="Stream Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mb-2"
        />
        <Textarea
          placeholder="Stream Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="h-24"
        />
      </div>
      <Button 
        onClick={handleEndStream}
        className="w-full bg-red-500 hover:bg-red-600"
        disabled={isLoading}
      >
        <Video className="h-4 w-4 mr-2" />
        End Stream
      </Button>
    </div>
  );
};