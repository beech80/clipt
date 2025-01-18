import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Download, Trash2 } from "lucide-react";

export function DataPrivacySettings() {
  const { user } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      const { data, error } = await supabase.functions.invoke('user-data-management', {
        body: { action: 'export', userId: user?.id }
      });

      if (error) throw error;

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

      toast.success("Data exported successfully");
    } catch (error) {
      toast.error("Failed to export data");
      console.error("Export error:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return;
    }

    try {
      setIsDeleting(true);
      const { error } = await supabase.functions.invoke('user-data-management', {
        body: { action: 'delete', userId: user?.id }
      });

      if (error) throw error;

      toast.success("Account deleted successfully");
      // Sign out user after deletion
      await supabase.auth.signOut();
    } catch (error) {
      toast.error("Failed to delete account");
      console.error("Delete error:", error);
    } finally {
      setIsDeleting(false);
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
          You can export your data at any time. The export will include all your personal information,
          posts, comments, and other content you've created.
        </AlertDescription>
      </Alert>

      <div className="flex flex-col gap-4">
        <Button
          onClick={handleExportData}
          disabled={isExporting}
          className="w-full sm:w-auto"
        >
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? "Exporting..." : "Export My Data"}
        </Button>

        <Button
          variant="destructive"
          onClick={handleDeleteAccount}
          disabled={isDeleting}
          className="w-full sm:w-auto"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {isDeleting ? "Deleting..." : "Delete Account"}
        </Button>
      </div>
    </div>
  );
}