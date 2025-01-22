import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormFeedback } from "@/components/ui/form-feedback";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export default function Index() {
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Example form submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Operation completed successfully!");
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("Failed to complete operation");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      // Example deletion
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Item deleted successfully");
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error("Deletion error:", error);
      toast.error("Failed to delete item");
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Welcome to the App</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Form fields would go here */}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Submit"
          )}
        </Button>

        <FormFeedback
          isLoading={isLoading}
          message={isLoading ? "Processing your request..." : undefined}
        />
      </form>

      <div className="pt-4">
        <Button
          variant="destructive"
          onClick={() => setShowDeleteConfirm(true)}
        >
          Delete Item
        </Button>
      </div>

      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Item"
        description="Are you sure you want to delete this item? This action cannot be undone."
        confirmText="Delete"
      />
    </div>
  );
}