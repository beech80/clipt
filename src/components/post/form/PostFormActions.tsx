import { Button } from "@/components/ui/button";

interface PostFormActionsProps {
  isSubmitting: boolean;
}

const PostFormActions = ({ isSubmitting }: PostFormActionsProps) => {
  return (
    <div className="flex justify-end mt-auto pb-2">
      <Button type="submit" disabled={isSubmitting} className="px-8">
        {isSubmitting ? "Posting..." : "Post"}
      </Button>
    </div>
  );
};

export default PostFormActions;