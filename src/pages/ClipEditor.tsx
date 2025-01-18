import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Loader2, Save, Undo, Redo, Download } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Effect {
  id: string;
  type: string;
  settings: Record<string, any>;
}

interface ClipEditingSession {
  id?: string;
  user_id?: string;
  clip_id?: string;
  effects: Effect[];
  edit_history?: Effect[][];
  status?: string;
  created_at?: string;
  updated_at?: string;
}

interface DatabaseClipSession {
  id: string;
  user_id: string;
  clip_id: string;
  effects: any;
  edit_history: any[];
  status: string;
  created_at: string;
  updated_at: string;
}

const ClipEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedEffect, setSelectedEffect] = useState<Effect | null>(null);
  const [appliedEffects, setAppliedEffects] = useState<Effect[]>([]);
  const [editHistory, setEditHistory] = useState<Effect[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const { data: effects, isLoading: effectsLoading } = useQuery({
    queryKey: ['clip-effects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clip_effects')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ['editing-session', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clip_editing_sessions')
        .select('*')
        .eq('clip_id', id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      // Transform database data to match our frontend types
      if (data) {
        const transformedData: ClipEditingSession = {
          id: data.id,
          user_id: data.user_id,
          clip_id: data.clip_id,
          effects: Array.isArray(data.effects) ? data.effects : [],
          edit_history: Array.isArray(data.edit_history) ? data.edit_history : [],
          status: data.status,
          created_at: data.created_at,
          updated_at: data.updated_at
        };
        return transformedData;
      }
      return null;
    },
    enabled: !!id
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const sessionData = {
        clip_id: id,
        effects: appliedEffects,
        edit_history: editHistory,
        status: 'draft'
      };

      const { error } = await supabase
        .from('clip_editing_sessions')
        .upsert(sessionData);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Changes saved successfully!");
    },
    onError: (error) => {
      toast.error("Failed to save changes");
      console.error("Save error:", error);
    }
  });

  const handleEffectChange = (effectId: string, value: number) => {
    setAppliedEffects(current => {
      const newEffects = current.map(effect => 
        effect.id === effectId 
          ? { ...effect, settings: { ...effect.settings, value } }
          : effect
      );
      
      // Add to history
      const newHistory = editHistory.slice(0, historyIndex + 1);
      newHistory.push(newEffects);
      setEditHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      
      return newEffects;
    });
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setAppliedEffects(editHistory[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < editHistory.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setAppliedEffects(editHistory[historyIndex + 1]);
    }
  };

  if (effectsLoading || sessionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clip Editor</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
          >
            <Undo className="w-4 h-4 mr-2" />
            Undo
          </Button>
          <Button
            variant="outline"
            onClick={handleRedo}
            disabled={historyIndex >= editHistory.length - 1}
          >
            <Redo className="w-4 h-4 mr-2" />
            Redo
          </Button>
          <Button onClick={() => saveMutation.mutate()}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
          <Button variant="secondary">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-9">
          <Card className="p-4">
            {/* Video preview will go here */}
            <div className="aspect-video bg-black rounded-lg" />
          </Card>
        </div>

        <div className="col-span-3">
          <Card>
            <ScrollArea className="h-[600px]">
              <div className="p-4 space-y-6">
                <h3 className="font-semibold mb-4">Effects</h3>
                {effects?.map((effect) => (
                  <div key={effect.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{effect.name}</span>
                      {effect.is_premium && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                          Premium
                        </span>
                      )}
                    </div>
                    <Slider
                      value={[appliedEffects.find(e => e.id === effect.id)?.settings?.value ?? 0]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={([value]) => handleEffectChange(effect.id, value)}
                    />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ClipEditor;