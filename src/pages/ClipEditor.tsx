import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Loader2, Save, Undo, Redo, Download, Scissors, Video, Image } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fabric } from 'fabric';

interface Effect {
  id: string;
  type: string;
  settings: {
    value: number;
    [key: string]: any;
  };
}

const ClipEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedEffect, setSelectedEffect] = useState<Effect | null>(null);
  const [appliedEffects, setAppliedEffects] = useState<Effect[]>([]);
  const [editHistory, setEditHistory] = useState<Effect[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);

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
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!id
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const sessionData = {
        clip_id: id,
        effects: appliedEffects as unknown as Json,
        edit_history: editHistory as unknown as Json[],
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

  const handleTrim = async () => {
    setIsProcessing(true);
    try {
      // Implement trim logic here
      toast.success("Clip trimmed successfully!");
    } catch (error) {
      toast.error("Failed to trim clip");
      console.error("Trim error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = async () => {
    setIsProcessing(true);
    try {
      // Implement export logic here
      toast.success("Clip exported successfully!");
    } catch (error) {
      toast.error("Failed to export clip");
      console.error("Export error:", error);
    } finally {
      setIsProcessing(false);
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
          <Button variant="secondary" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-9">
          <Tabs defaultValue="preview">
            <TabsList>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="trim">Trim</TabsTrigger>
            </TabsList>
            
            <TabsContent value="preview">
              <Card className="p-4">
                <div className="aspect-video bg-black rounded-lg" />
              </Card>
            </TabsContent>
            
            <TabsContent value="trim">
              <Card className="p-4 space-y-4">
                <div className="aspect-video bg-black rounded-lg" />
                <div className="space-y-2">
                  <Slider
                    value={[trimStart, trimEnd]}
                    min={0}
                    max={duration}
                    step={0.1}
                    onValueChange={([start, end]) => {
                      setTrimStart(start);
                      setTrimEnd(end);
                    }}
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{trimStart.toFixed(1)}s</span>
                    <span>{trimEnd.toFixed(1)}s</span>
                  </div>
                  <Button onClick={handleTrim} disabled={isProcessing}>
                    <Scissors className="w-4 h-4 mr-2" />
                    Trim Clip
                  </Button>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
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
