import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BackButton } from "@/components/ui/back-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

const ModReports = () => {
  const { user } = useAuth();

  const { data: reports, refetch } = useQuery({
    queryKey: ['content-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_reports')
        .select(`
          *,
          reporter:profiles!content_reports_reporter_id_fkey(username),
          resolver:profiles!content_reports_resolved_by_fkey(username)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleResolveReport = async (reportId: string) => {
    const { error } = await supabase
      .from('content_reports')
      .update({
        status: 'resolved',
        resolved_by: user?.id,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', reportId);

    if (error) {
      toast.error("Failed to resolve report");
    } else {
      toast.success("Report resolved successfully");
      refetch();
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-6">
        <BackButton />
        <h1 className="text-2xl font-bold">Content Reports</h1>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Reporter</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reported</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports?.map((report) => (
              <TableRow key={report.id}>
                <TableCell className="font-medium">
                  {report.content_type}
                </TableCell>
                <TableCell>{report.reason}</TableCell>
                <TableCell>{report.reporter?.username}</TableCell>
                <TableCell>
                  <Badge
                    variant={report.status === 'pending' ? 'destructive' : 'default'}
                  >
                    {report.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                </TableCell>
                <TableCell>
                  {report.status === 'pending' && (
                    <Button
                      size="sm"
                      onClick={() => handleResolveReport(report.id)}
                    >
                      Resolve
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ModReports;