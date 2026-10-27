
import React from 'react';
import { Card } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';

export const SecurityEvents = () => {
  const { data: events, isLoading } = useQuery({
    queryKey: ['security-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      const ids = [...new Set(data.map(event => event.user_id).filter(Boolean))];
      const { data: profiles, error: profileError } = ids.length
        ? await supabase.from('profiles').select('id, username').in('id', ids)
        : { data: [], error: null };
      if (profileError) throw profileError;
      const byId = new Map(profiles.map(profile => [profile.id, profile] as const));
      return data.map(event => ({ ...event, user: byId.get(event.user_id) }));
    }
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-yellow-500/10 text-yellow-500';
      case 'medium': return 'bg-orange-500/10 text-orange-500';
      case 'high': return 'bg-red-500/10 text-red-500';
      case 'critical': return 'bg-red-700/10 text-red-700';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex justify-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      ) : events?.length === 0 ? (
        <Card className="p-6">
          <p className="text-center text-muted-foreground">No security events logged</p>
        </Card>
      ) : (
        events?.map((event) => (
          <Card key={event.id} className="p-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold">{event.event_type}</h4>
                  <p className="text-sm text-muted-foreground">
                    {event.user?.username ? `User: ${event.user.username}` : 'Anonymous'} • 
                    {new Date(event.created_at).toLocaleString()}
                  </p>
                </div>
                <Badge className={getSeverityColor(event.severity)}>
                  {event.severity}
                </Badge>
              </div>

              <div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">IP Address</p>
                    <p className="text-muted-foreground">{event.ip_address}</p>
                  </div>
                  <div>
                    <p className="font-medium">User Agent</p>
                    <p className="text-muted-foreground">{event.user_agent}</p>
                  </div>
                </div>
              </div>

              {event.details && (
                <div className="bg-card-secondary p-4 rounded-lg">
                  <pre className="text-sm whitespace-pre-wrap">
                    {JSON.stringify(event.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </Card>
        ))
      )}
    </div>
  );
};
