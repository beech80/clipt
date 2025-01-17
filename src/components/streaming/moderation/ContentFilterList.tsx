import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useState } from "react";

export function ContentFilterList() {
  const [newFilter, setNewFilter] = useState({
    word: "",
    category: "profanity",
    severity_level: "medium",
    is_regex: false
  });

  const { data: filters, refetch } = useQuery({
    queryKey: ['content-filters'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_filters')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const handleAddFilter = async () => {
    try {
      const { error } = await supabase
        .from('content_filters')
        .insert([newFilter]);

      if (error) throw error;

      toast.success('Filter added successfully');
      refetch();
      setNewFilter({
        word: "",
        category: "profanity",
        severity_level: "medium",
        is_regex: false
      });
    } catch (error) {
      toast.error('Failed to add filter');
    }
  };

  const handleToggleFilter = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('content_filters')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;
      refetch();
    } catch (error) {
      toast.error('Failed to update filter');
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Add New Filter</h3>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              placeholder="Word or pattern"
              value={newFilter.word}
              onChange={(e) => setNewFilter({ ...newFilter, word: e.target.value })}
            />
            <Select
              value={newFilter.category}
              onValueChange={(value) => setNewFilter({ ...newFilter, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="profanity">Profanity</SelectItem>
                <SelectItem value="spam">Spam</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              value={newFilter.severity_level}
              onValueChange={(value) => setNewFilter({ ...newFilter, severity_level: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-2">
              <Switch
                checked={newFilter.is_regex}
                onCheckedChange={(checked) => setNewFilter({ ...newFilter, is_regex: checked })}
              />
              <span className="text-sm">Is Regex Pattern</span>
            </div>
          </div>
          <Button onClick={handleAddFilter}>Add Filter</Button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Active Filters</h3>
        <div className="space-y-2">
          {filters?.map((filter) => (
            <div
              key={filter.id}
              className="flex items-center justify-between p-3 bg-muted rounded-lg"
            >
              <div className="space-y-1">
                <p className="font-medium">{filter.word}</p>
                <div className="flex space-x-2 text-sm text-muted-foreground">
                  <span>{filter.category}</span>
                  <span>•</span>
                  <span>{filter.severity_level}</span>
                  {filter.is_regex && <span>• Regex</span>}
                </div>
              </div>
              <Switch
                checked={filter.is_active}
                onCheckedChange={() => handleToggleFilter(filter.id, filter.is_active)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}