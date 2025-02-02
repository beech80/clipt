import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Trophy, Users, MessageSquare } from 'lucide-react';

interface InteractionTrackerProps {
  streamId: string;
}

interface InteractionStats {
  totalInteractions: number;
  uniqueViewers: number;
  topInteractors: Array<{
    viewer_id: string;
    interaction_count: number;
    username?: string;
  }>;
  recentInteractions: Array<{
    type: string;
    created_at: string;
    viewer_username?: string;
  }>;
}

export function InteractionTracker({ streamId }: InteractionTrackerProps) {
  const [stats, setStats] = useState<InteractionStats>({
    totalInteractions: 0,
    uniqueViewers: 0,
    topInteractors: [],
    recentInteractions: []
  });

  useEffect(() => {
    const fetchStats = async () => {
      // Get total interactions
      const { data: totalData, error: totalError } = await supabase
        .from('stream_interactions')
        .select('count')
        .eq('stream_id', streamId)
        .single();

      // Get unique viewers
      const { count: uniqueViewersCount } = await supabase
        .from('stream_interactions')
        .select('viewer_id', { count: 'exact', head: true })
        .eq('stream_id', streamId);

      // Get top interactors
      const { data: topData, error: topError } = await supabase
        .from('stream_interactions')
        .select(`
          viewer_id,
          profiles:viewer_id (username)
        `)
        .eq('stream_id', streamId)
        .limit(5);

      // Get recent interactions
      const { data: recentData, error: recentError } = await supabase
        .from('stream_interactions')
        .select(`
          interaction_type,
          created_at,
          profiles:viewer_id (username)
        `)
        .eq('stream_id', streamId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!totalError && !topError && !recentError) {
        setStats({
          totalInteractions: totalData?.count || 0,
          uniqueViewers: uniqueViewersCount || 0,
          topInteractors: topData?.map(item => ({
            viewer_id: item.viewer_id,
            interaction_count: 1,
            username: item.profiles?.username
          })) || [],
          recentInteractions: recentData?.map(item => ({
            type: item.interaction_type,
            created_at: item.created_at,
            viewer_username: item.profiles?.username
          })) || []
        });
      }
    };

    fetchStats();

    const channel = supabase
      .channel(`stream_interactions:${streamId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'stream_interactions',
        filter: `stream_id=eq.${streamId}`
      }, fetchStats)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamId]);

  return (
    <Card className="p-4 space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <Trophy className="h-5 w-5 mx-auto mb-2" />
          <div className="text-2xl font-bold">{stats.totalInteractions}</div>
          <div className="text-sm text-muted-foreground">Total Interactions</div>
        </div>
        <div className="text-center">
          <Users className="h-5 w-5 mx-auto mb-2" />
          <div className="text-2xl font-bold">{stats.uniqueViewers}</div>
          <div className="text-sm text-muted-foreground">Unique Viewers</div>
        </div>
        <div className="text-center">
          <MessageSquare className="h-5 w-5 mx-auto mb-2" />
          <div className="text-2xl font-bold">
            {(stats.totalInteractions / Math.max(stats.uniqueViewers, 1)).toFixed(1)}
          </div>
          <div className="text-sm text-muted-foreground">Interactions/Viewer</div>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-medium">Recent Activity</h4>
        {stats.recentInteractions.map((interaction, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <span>{interaction.viewer_username}</span>
            <span className="text-muted-foreground">
              {new Date(interaction.created_at).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-medium">Top Interactors</h4>
        {stats.topInteractors.map((interactor, index) => (
          <div key={index} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>{interactor.username}</span>
              <span>{interactor.interaction_count}</span>
            </div>
            <Progress
              value={(interactor.interaction_count / Math.max(...stats.topInteractors.map(t => t.interaction_count))) * 100}
            />
          </div>
        ))}
      </div>
    </Card>
  );
}