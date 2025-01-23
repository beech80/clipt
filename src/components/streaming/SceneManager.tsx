import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Layers, Settings, Monitor } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { SceneSourceEditor } from "./SceneSourceEditor";
import { useAuth } from "@/contexts/AuthContext";

interface Scene {
  id: string;
  name: string;
  layout: any;
  sort_order: number;
  is_active: boolean;
}

export function SceneManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);

  const { data: scenes, isLoading } = useQuery({
    queryKey: ['scenes', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scenes')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as Scene[];
    },
    enabled: !!user?.id
  });

  const createScene = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('scenes')
        .insert([{
          user_id: user?.id,
          name,
          sort_order: (scenes?.length || 0) + 1
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenes'] });
      toast.success("Scene created successfully");
    },
    onError: () => {
      toast.error("Failed to create scene");
    }
  });

  const setActiveScene = useMutation({
    mutationFn: async (sceneId: string) => {
      const { error } = await supabase
        .from('scenes')
        .update({ is_active: true })
        .eq('id', sceneId);
      
      if (error) throw error;
      
      // Deactivate other scenes
      await supabase
        .from('scenes')
        .update({ is_active: false })
        .neq('id', sceneId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenes'] });
      toast.success("Scene activated");
    }
  });

  const handleNewScene = () => {
    const name = prompt("Enter scene name");
    if (name) {
      createScene.mutate(name);
    }
  };

  if (isLoading) {
    return <div>Loading scenes...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Scenes</h2>
        <Button onClick={handleNewScene} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          New Scene
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scenes?.map((scene) => (
          <Card 
            key={scene.id}
            className={`p-4 cursor-pointer transition-all hover:border-primary ${
              scene.is_active ? 'border-primary bg-primary/5' : ''
            }`}
            onClick={() => setSelectedScene(scene)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                <span>{scene.name}</span>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveScene.mutate(scene.id);
                  }}
                >
                  <Monitor className={`w-4 h-4 ${scene.is_active ? 'text-primary' : ''}`} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedScene(scene);
                  }}
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {selectedScene && (
        <SceneSourceEditor 
          sceneId={selectedScene.id} 
          onClose={() => setSelectedScene(null)}
        />
      )}
    </div>
  );
}