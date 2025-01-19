import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { FileText, Edit, Trash } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const DraftsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: drafts, isLoading, refetch } = useQuery({
    queryKey: ['drafts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_published', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleEdit = (draftId: string) => {
    navigate(`/post/${draftId}/edit`);
  };

  const handleDelete = async (draftId: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', draftId);

      if (error) throw error;

      toast.success("Draft deleted successfully");
      refetch();
    } catch (error) {
      toast.error("Failed to delete draft");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <FileText className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Saved Drafts</h1>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">Loading drafts...</div>
        ) : drafts?.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No drafts yet</h3>
            <p className="text-muted-foreground">Your unpublished posts will appear here!</p>
          </div>
        ) : (
          drafts?.map((draft) => (
            <Card key={draft.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-medium line-clamp-2">{draft.content || 'Untitled draft'}</p>
                  <span className="text-sm text-muted-foreground">
                    Last edited {formatDistanceToNow(new Date(draft.created_at), { addSuffix: true })}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleEdit(draft.id)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDelete(draft.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default DraftsPage;