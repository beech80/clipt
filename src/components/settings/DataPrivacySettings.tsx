import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Download, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function DataPrivacySettings() {
  const { user } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const navigate = useNavigate();

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      const { data, error } = await supabase.functions.invoke('user-data-management', {
        body: { action: 'export', userId: user?.id }
      });

      if (error) throw error;

      if (!data?.data || data.data.profile?.id !== user?.id) {
        throw new Error('The server did not confirm an account export');
      }

      // Create and download file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `data-export-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Account export download started");
    } catch (error) {
      toast.error("Failed to export data");
      console.error("Export error:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Data Privacy Settings</h2>
        <p className="text-sm text-muted-foreground">
          Manage your personal data and account settings
        </p>
      </div>

      <Alert>
        <AlertDescription>
          Download available profile, post, comment, sent-message, stream metadata,
          achievement, collection and gaming-history records. This preview export is not a
          complete account archive and does not include media files or stream credentials.
        </AlertDescription>
      </Alert>

      <div className="flex flex-col gap-4">
        <Button
          onClick={handleExportData}
          disabled={isExporting || !user}
          className="w-full sm:w-auto"
        >
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? "Exporting..." : "Export My Data"}
        </Button>

        <Button
          variant="destructive"
          onClick={() => navigate('/delete-account')}
          disabled={!user}
          className="w-full sm:w-auto"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Account
        </Button>
      </div>
    </div>
  );
}
