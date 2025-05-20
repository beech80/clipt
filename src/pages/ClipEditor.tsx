import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Loader2, Save, Undo, Redo, Download, Scissors } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Json } from "@/integrations/supabase/types";

interface ClipEditingSession {
  id?: string;
  user_id?: string;
  clip_id?: string;
  effects: any[];
  edit_history: any[][];
  status?: string;
  created_at?: string;
  updated_at?: string;
}

const ClipEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [editHistory, setEditHistory] = useState<any[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(100);
  const [videoDuration, setVideoDuration] = useState(0);

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ['editing-session', id],
    queryFn: async () => {
      const { data: dbData, error } = await supabase
        .from('clip_editing_sessions')
        .select('*')
        .eq('clip_id', id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      if (dbData) {
        const parsedHistory = (dbData.edit_history as unknown as any[][]).map(historyEntry =>
          historyEntry.map(effect => ({
            ...effect
          }))
        );

        return {
          ...dbData,
          edit_history: parsedHistory
        } as ClipEditingSession;
      }
      return null;
    },
    enabled: !!id
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const sessionData = {
        clip_id: id,
        effects: [],
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

  const handleTrim = () => {
    toast.success(`Video trimmed from ${trimStart}% to ${trimEnd}%`);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < editHistory.length - 1) {
      setHistoryIndex(historyIndex + 1);
    }
  };

  if (sessionLoading) {
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
        <div className="col-span-12">
          <Card className="p-4">
            <div className="aspect-video bg-black rounded-lg" />
            
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Trim Video</h3>
                <Button onClick={handleTrim} variant="secondary" size="sm">
                  <Scissors className="w-4 h-4 mr-2" />
                  Apply Trim
                </Button>
              </div>
              <Slider
                value={[trimStart, trimEnd]}
                min={0}
                max={100}
                step={1}
                onValueChange={([start, end]) => {
                  setTrimStart(start);
                  setTrimEnd(end);
                }}
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{trimStart}%</span>
                <span>{trimEnd}%</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ClipEditor;