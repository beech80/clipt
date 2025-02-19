
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const ContentFilters = () => {
  const queryClient = useQueryClient();
  const [newFilter, setNewFilter] = useState({
    word: '',
    category: 'profanity',
    severity_level: 'medium',
    action_type: 'block'
  });

  const { data: filters, isLoading } = useQuery({
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

  const addFilterMutation = useMutation({
    mutationFn: async (filterData: typeof newFilter) => {
      const { error } = await supabase
        .from('content_filters')
        .insert([filterData]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-filters'] });
      toast.success('Filter added successfully');
      setNewFilter({
        word: '',
        category: 'profanity',
        severity_level: 'medium',
        action_type: 'block'
      });
    },
    onError: (error) => {
      toast.error('Failed to add filter');
      console.error('Error adding filter:', error);
    }
  });

  const deleteFilterMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('content_filters')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-filters'] });
      toast.success('Filter deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete filter');
      console.error('Error deleting filter:', error);
    }
  });

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Add New Filter</h3>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              placeholder="Filter word or pattern"
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
                <SelectItem value="harassment">Harassment</SelectItem>
                <SelectItem value="spam">Spam</SelectItem>
                <SelectItem value="hate-speech">Hate Speech</SelectItem>
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
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={newFilter.action_type}
              onValueChange={(value) => setNewFilter({ ...newFilter, action_type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="block">Block</SelectItem>
                <SelectItem value="flag">Flag</SelectItem>
                <SelectItem value="replace">Replace</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={() => addFilterMutation.mutate(newFilter)}
            disabled={!newFilter.word.trim()}
          >
            Add Filter
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Active Filters</h3>
        {isLoading ? (
          <div className="flex justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {filters?.map((filter) => (
              <div key={filter.id} className="flex items-center justify-between p-4 bg-card-secondary rounded-lg">
                <div>
                  <p className="font-medium">{filter.word}</p>
                  <p className="text-sm text-muted-foreground">
                    {filter.category} • {filter.severity_level} • {filter.action_type}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteFilterMutation.mutate(filter.id)}
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
