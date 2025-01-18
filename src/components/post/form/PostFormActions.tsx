import { Button } from "@/components/ui/button";

interface PostFormActionsProps {
  isSubmitting: boolean;
}

const PostFormActions = ({ isSubmitting }: PostFormActionsProps) => {
  return (
    <div className="flex justify-end">
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Posting..." : "Post"}
      </Button>
    </div>
  );
};

export default PostFormActions;