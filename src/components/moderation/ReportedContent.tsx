import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface ReportedContent {
  id: string;
  reporter: { username: string } | null;
  content: {
    id: string;
    content: string;
    user_id: string;
    profiles: { username: string } | null;
  } | null;
  created_at: string;
  resolved_at: string | null;
  severity_level: string;
  reason: string;
  status: string;
  action_taken: string | null;
  notes: string | null;
}

export const ReportedContent = () => {
  const queryClient = useQueryClient();

  const { data: reports, isLoading } = useQuery<ReportedContent[]>({
    queryKey: ['content-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_reports')
        .select(`
          *,
          reporter:reporter_id(username),
          content:content_id(
            id,
            content,
            user_id,
            profiles:user_id(username)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ReportedContent[];
    }
  });

  const handleReportMutation = useMutation({
    mutationFn: async ({ reportId, action, notes }: { reportId: string, action: string, notes?: string }) => {
      const { error } = await supabase
        .from('content_reports')
        .update({
          status: 'resolved',
          action_taken: action,
          notes,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', reportId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-reports'] });
      toast.success('Report handled successfully');
    },
    onError: (error) => {
      toast.error('Failed to handle report');
      console.error('Error handling report:', error);
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
      ) : reports?.length === 0 ? (
        <Card className="p-6">
          <p className="text-center text-muted-foreground">No reports to review</p>
        </Card>
      ) : (
        reports?.map((report) => (
          <Card key={report.id} className="p-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold">Reported Content</h4>
                  <p className="text-sm text-muted-foreground">
                    by {report.reporter?.username} • {new Date(report.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge className={getSeverityColor(report.severity_level)}>
                  {report.severity_level}
                </Badge>
              </div>

              <div>
                <h5 className="font-medium">Reason:</h5>
                <p className="text-muted-foreground">{report.reason}</p>
              </div>

              {report.content && (
                <div className="bg-card-secondary p-4 rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Content by {report.content.profiles?.username}:
                  </p>
                  <p>{report.content.content}</p>
                </div>
              )}

              {report.status === 'pending' ? (
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    onClick={() => handleReportMutation.mutate({
                      reportId: report.id,
                      action: 'content_removed',
                      notes: 'Content violated community guidelines'
                    })}
                  >
                    Remove Content
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleReportMutation.mutate({
                      reportId: report.id,
                      action: 'warning_issued',
                      notes: 'Warning issued to user'
                    })}
                  >
                    Issue Warning
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleReportMutation.mutate({
                      reportId: report.id,
                      action: 'dismissed',
                      notes: 'Report dismissed - no violation found'
                    })}
                  >
                    Dismiss
                  </Button>
                </div>
              ) : (
                <div>
                  <Badge variant="outline">
                    {report.action_taken} • {new Date(report.resolved_at!).toLocaleDateString()}
                  </Badge>
                  {report.notes && (
                    <p className="text-sm text-muted-foreground mt-2">{report.notes}</p>
                  )}
                </div>
              )}
            </div>
          </Card>
        ))
      )}
    </div>
  );
};
