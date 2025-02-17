
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { ContentModerationItem, ModerationAction } from '@/types/moderation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useState } from 'react';

export const ModerationQueue = () => {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState<string>('');

  const { data: moderationItems, isLoading } = useQuery({
    queryKey: ['moderation-queue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_moderation')
        .select(`
          *,
          posts (content, image_url, video_url),
          profiles (username, avatar_url)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ContentModerationItem[];
    }
  });

  const moderationMutation = useMutation({
    mutationFn: async (action: ModerationAction) => {
      const { error } = await supabase
        .from('content_moderation')
        .update({
          status: action.status,
          reason: action.reason,
          moderated_by: (await supabase.auth.getUser()).data.user?.id,
          moderated_at: new Date().toISOString()
        })
        .eq('content_id', action.content_id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderation-queue'] });
      toast.success('Content moderated successfully');
      setReason('');
    },
    onError: (error) => {
      toast.error('Failed to moderate content');
      console.error('Moderation error:', error);
    }
  });

  const handleModeration = (contentId: string, status: 'approved' | 'rejected') => {
    moderationMutation.mutate({
      content_id: contentId,
      content_type: 'post',
      status,
      reason: reason.trim() || undefined
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!moderationItems?.length) {
    return (
      <div className="text-center p-8">
        <h2 className="text-xl font-semibold mb-2">No items to moderate</h2>
        <p className="text-muted-foreground">The moderation queue is empty.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-bold mb-4">Moderation Queue</h1>
      {moderationItems.map((item) => (
        <Card key={item.id} className="w-full">
          <CardHeader>
            <CardTitle>Content Review Required</CardTitle>
            <CardDescription>
              Submitted {new Date(item.created_at).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {item.content?.text && (
                <div className="p-4 bg-muted rounded-lg">
                  <p>{item.content.text}</p>
                </div>
              )}
              {item.content?.image_url && (
                <img 
                  src={item.content.image_url} 
                  alt="Content to moderate" 
                  className="max-h-[300px] rounded-lg object-cover"
                />
              )}
              {item.content?.video_url && (
                <video 
                  src={item.content.video_url}
                  controls
                  className="max-h-[300px] rounded-lg w-full"
                />
              )}
              <Textarea
                placeholder="Reason for decision (optional)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-4"
              />
            </div>
          </CardContent>
          <CardFooter className="space-x-2">
            <Button
              variant="destructive"
              onClick={() => handleModeration(item.content_id, 'rejected')}
              disabled={moderationMutation.isPending}
            >
              Reject
            </Button>
            <Button
              variant="default"
              onClick={() => handleModeration(item.content_id, 'approved')}
              disabled={moderationMutation.isPending}
            >
              Approve
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};
