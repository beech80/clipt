import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormFeedback } from "@/components/ui/form-feedback";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

// Skip link component for keyboard navigation
const SkipLink = () => (
  <a
    href="#main-content"
    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md focus:z-50"
    aria-label="Skip to main content"
  >
    Skip to main content
  </a>
);

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
    <>
      <SkipLink />
      <div 
        className="container mx-auto p-6 space-y-6"
        role="main"
        id="main-content"
        aria-label="Main content"
      >
        <h1 
          className="text-2xl font-bold"
          tabIndex={0}
          aria-label="Welcome to the App"
        >
          Welcome to the App
        </h1>

        <form 
          onSubmit={handleSubmit} 
          className="space-y-4"
          aria-label="Example form"
          role="form"
        >
          {/* Form fields would go here */}
          <Button 
            type="submit" 
            disabled={isLoading}
            aria-busy={isLoading}
            aria-label={isLoading ? "Processing submission" : "Submit form"}
          >
            {isLoading ? (
              <>
                <Loader2 
                  className="mr-2 h-4 w-4 animate-spin" 
                  aria-hidden="true"
                />
                <span>Processing...</span>
              </>
            ) : (
              "Submit"
            )}
          </Button>

          <FormFeedback
            isLoading={isLoading}
            message={isLoading ? "Processing your request..." : undefined}
            aria-live="polite"
          />
        </form>

        <div className="pt-4">
          <Button
            variant="destructive"
            onClick={() => setShowDeleteConfirm(true)}
            aria-label="Delete item"
            aria-haspopup="dialog"
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
          aria-label="Delete confirmation dialog"
        />
      </div>
    </>
  );
}