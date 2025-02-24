
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import type { ChatFilter } from "@/types/chat";

interface ChatFilterListProps {
  streamId: string;
}

export function ChatFilterList({ streamId }: ChatFilterListProps) {
  const queryClient = useQueryClient();
  const [newFilter, setNewFilter] = useState({
    pattern: "",
    filter_type: "block",
    replacement: "",
    is_regex: false
  });

  const { data: filters } = useQuery({
    queryKey: ['chat-filters', streamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_filters')
        .select('*')
        .eq('stream_id', streamId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ChatFilter[];
    }
  });

  const addFilter = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('chat_filters')
        .insert([{
          ...newFilter,
          stream_id: streamId
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-filters', streamId] });
      toast.success('Filter added successfully');
      setNewFilter({
        pattern: "",
        filter_type: "block",
        replacement: "",
        is_regex: false
      });
    },
    onError: () => {
      toast.error('Failed to add filter');
    }
  });

  const toggleFilter = useMutation({
    mutationFn: async (filter: ChatFilter) => {
      const { error } = await supabase
        .from('chat_filters')
        .update({ is_active: !filter.is_active })
        .eq('id', filter.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-filters', streamId] });
    },
    onError: () => {
      toast.error('Failed to update filter');
    }
  });

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Add New Filter</h3>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              placeholder="Word or pattern"
              value={newFilter.pattern}
              onChange={(e) => setNewFilter({ ...newFilter, pattern: e.target.value })}
            />
            <Select
              value={newFilter.filter_type}
              onValueChange={(value) => setNewFilter({ ...newFilter, filter_type: value as "block" | "replace" | "warn" })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="block">Block</SelectItem>
                <SelectItem value="replace">Replace</SelectItem>
                <SelectItem value="warn">Warn</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {newFilter.filter_type === "replace" && (
            <Input
              placeholder="Replacement text"
              value={newFilter.replacement}
              onChange={(e) => setNewFilter({ ...newFilter, replacement: e.target.value })}
            />
          )}
          <div className="flex items-center space-x-2">
            <Switch
              checked={newFilter.is_regex}
              onCheckedChange={(checked) => setNewFilter({ ...newFilter, is_regex: checked })}
            />
            <span className="text-sm">Is Regex Pattern</span>
          </div>
          <Button onClick={() => addFilter.mutate()}>Add Filter</Button>
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
                <p className="font-medium">{filter.pattern}</p>
                <div className="flex space-x-2 text-sm text-muted-foreground">
                  <span>{filter.filter_type}</span>
                  {filter.is_regex && <span>• Regex</span>}
                </div>
              </div>
              <Switch
                checked={filter.is_active}
                onCheckedChange={() => toggleFilter.mutate(filter)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
