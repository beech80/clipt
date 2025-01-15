import { Button } from "@/components/ui/button";

interface FormActionsProps {
  isSubmitting: boolean;
}

const FormActions = ({ isSubmitting }: FormActionsProps) => {
  return (
    <div className="flex justify-end">
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Posting..." : "Post"}
      </Button>
    </div>
  );
};

export default FormActions;