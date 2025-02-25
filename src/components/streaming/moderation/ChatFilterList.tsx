
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { ChatFilter } from '@/types/chat';

interface ChatFilterListProps {
  streamId: string;
}

export const ChatFilterList = ({ streamId }: ChatFilterListProps) => {
  const [pattern, setPattern] = useState('');
  const [filterType, setFilterType] = useState<'block' | 'replace' | 'warn'>('block');
  const [replacement, setReplacement] = useState('');
  const [isRegex, setIsRegex] = useState(false);
  const queryClient = useQueryClient();

  const { data: filters } = useQuery({
    queryKey: ['chat-filters', streamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_filters')
        .select('*')
        .eq('stream_id', streamId);
      
      if (error) throw error;
      return data as ChatFilter[];
    }
  });

  const addFilter = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('chat_filters')
        .insert([{
          stream_id: streamId,
          pattern,
          filter_type: filterType,
          replacement: filterType === 'replace' ? replacement : null,
          is_regex: isRegex
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-filters', streamId] });
      toast.success('Filter added successfully');
      setPattern('');
      setReplacement('');
    },
    onError: () => {
      toast.error('Failed to add filter');
    }
  });

  const deleteFilter = useMutation({
    mutationFn: async (filterId: string) => {
      const { error } = await supabase
        .from('chat_filters')
        .delete()
        .eq('id', filterId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-filters', streamId] });
      toast.success('Filter removed successfully');
    },
    onError: () => {
      toast.error('Failed to remove filter');
    }
  });

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Add New Filter</h3>
        <div className="space-y-4">
          <div>
            <Input
              placeholder="Enter word or pattern to filter"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
            />
          </div>
          
          <div className="flex gap-4">
            <Select value={filterType} onValueChange={(value: 'block' | 'replace' | 'warn') => setFilterType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select filter type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="block">Block</SelectItem>
                <SelectItem value="replace">Replace</SelectItem>
                <SelectItem value="warn">Warn</SelectItem>
              </SelectContent>
            </Select>

            {filterType === 'replace' && (
              <Input
                placeholder="Replacement text"
                value={replacement}
                onChange={(e) => setReplacement(e.target.value)}
              />
            )}
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={isRegex}
              onCheckedChange={setIsRegex}
            />
            <span className="text-sm">Use regex pattern</span>
          </div>

          <Button onClick={() => addFilter.mutate()}>Add Filter</Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Active Filters</h3>
        <div className="space-y-4">
          {filters?.map((filter) => (
            <div
              key={filter.id}
              className="flex items-center justify-between p-4 bg-muted rounded-lg"
            >
              <div className="space-y-1">
                <p className="font-medium">{filter.pattern}</p>
                <div className="flex gap-2 text-sm text-muted-foreground">
                  <span>Type: {filter.filter_type}</span>
                  {filter.is_regex && <span>• Regex</span>}
                  {filter.replacement && <span>• Replaces with: {filter.replacement}</span>}
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteFilter.mutate(filter.id)}
              >
                Remove
              </Button>
            </div>
          ))}
          {filters?.length === 0 && (
            <p className="text-muted-foreground text-center py-4">No filters added yet</p>
          )}
        </div>
      </Card>
    </div>
  );
};
