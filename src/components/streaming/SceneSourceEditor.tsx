import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, Move } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { SceneSource } from "@/types/broadcast";

interface SceneSourceEditorProps {
  sceneId: string;
  onClose: () => void;
}

const sourceTypes = [
  { value: 'camera', label: 'Camera' },
  { value: 'capture', label: 'Screen Capture' },
  { value: 'browser', label: 'Browser Source' },
  { value: 'image', label: 'Image' },
];

export function SceneSourceEditor({ sceneId, onClose }: SceneSourceEditorProps) {
  const queryClient = useQueryClient();
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceType, setNewSourceType] = useState(sourceTypes[0].value);

  const { data: sources, isLoading } = useQuery({
    queryKey: ['scene-sources', sceneId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scene_sources')
        .select('*')
        .eq('scene_id', sceneId)
        .order('position->z_index');
      
      if (error) throw error;
      
      // Parse the JSONB fields
      return (data || []).map(source => ({
        ...source,
        settings: source.settings as Record<string, unknown>,
        position: source.position as SceneSource['position']
      })) as SceneSource[];
    }
  });

  const addSource = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('scene_sources')
        .insert([{
          scene_id: sceneId,
          name: newSourceName,
          type: newSourceType,
          position: {
            x: 0,
            y: 0,
            width: 1920,
            height: 1080,
            z_index: sources?.length || 0
          }
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scene-sources'] });
      setNewSourceName('');
      toast.success("Source added successfully");
    }
  });

  const deleteSource = useMutation({
    mutationFn: async (sourceId: string) => {
      const { error } = await supabase
        .from('scene_sources')
        .delete()
        .eq('id', sourceId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scene-sources'] });
      toast.success("Source deleted successfully");
    }
  });

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Scene Sources</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Source name"
            value={newSourceName}
            onChange={(e) => setNewSourceName(e.target.value)}
          />
          <Select
            value={newSourceType}
            onValueChange={setNewSourceType}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Source type" />
            </SelectTrigger>
            <SelectContent>
              {sourceTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => addSource.mutate()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Source
          </Button>
        </div>

        <div className="space-y-2">
          {sources?.map((source) => (
            <Card key={source.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Move className="w-4 h-4 cursor-move" />
                  <span>{source.name}</span>
                  <span className="text-sm text-muted-foreground">
                    ({source.type})
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteSource.mutate(source.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Card>
  );
}