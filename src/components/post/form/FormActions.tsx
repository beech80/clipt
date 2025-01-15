import { Button } from "@/components/ui/button";

interface FormActionsProps {
  isSubmitting: boolean;
  isEditing?: boolean;
}

const FormActions = ({ isSubmitting, isEditing = false }: FormActionsProps) => {
  return (
    <div className="flex justify-end">
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <span>
            {isEditing ? "Updating..." : "Posting..."}
          </span>
        ) : (
          <span>
            {isEditing ? "Update" : "Post"}
          </span>
        )}
      </Button>
    </div>
  );
};

export default FormActions;