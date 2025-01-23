import React from "react";
import { useForm } from "react-hook-form";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Save } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface BroadcastPresetFormProps {
  userId: string;
  presetId?: string;
}

export function BroadcastPresetForm({ userId, presetId }: BroadcastPresetFormProps) {
  const { register, handleSubmit, setValue } = useForm();

  const { data: preset } = useQuery({
    queryKey: ['broadcast-preset', presetId],
    queryFn: async () => {
      if (!presetId) return null;
      const { data, error } = await supabase
        .from('broadcast_presets')
        .select('*')
        .eq('id', presetId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!presetId
  });

  const createPreset = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('broadcast_presets')
        .insert({
          user_id: userId,
          ...data
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Preset saved successfully");
    },
    onError: () => {
      toast.error("Failed to save preset");
    }
  });

  const onSubmit = (data: any) => {
    createPreset.mutate(data);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="w-5 h-5" />
        <h2 className="text-xl font-bold">Broadcast Preset</h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Preset Name</Label>
            <Input {...register("name")} placeholder="My Streaming Preset" />
          </div>

          <div className="space-y-2">
            <Label>Encoder Preset</Label>
            <Select onValueChange={(value) => setValue("encoder_preset", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select encoder preset" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ultrafast">Ultrafast</SelectItem>
                <SelectItem value="superfast">Superfast</SelectItem>
                <SelectItem value="veryfast">Very Fast</SelectItem>
                <SelectItem value="faster">Faster</SelectItem>
                <SelectItem value="fast">Fast</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="slow">Slow</SelectItem>
                <SelectItem value="slower">Slower</SelectItem>
                <SelectItem value="veryslow">Very Slow</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Resolution</Label>
              <Select onValueChange={(value) => setValue("video_settings.resolution", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select resolution" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1920x1080">1920x1080</SelectItem>
                  <SelectItem value="1280x720">1280x720</SelectItem>
                  <SelectItem value="854x480">854x480</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>FPS</Label>
              <Select onValueChange={(value) => setValue("video_settings.fps", parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select FPS" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30</SelectItem>
                  <SelectItem value="60">60</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Button type="submit" className="w-full">
          <Save className="w-4 h-4 mr-2" />
          Save Preset
        </Button>
      </form>
    </Card>
  );
}