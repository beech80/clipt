import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface CollectionSelectorProps {
  postId: string;
  onSuccess: () => void;
}

const CollectionSelector = ({ postId, onSuccess }: CollectionSelectorProps) => {
  const { user } = useAuth();
  const [newCollectionName, setNewCollectionName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const { data: collections, refetch } = useQuery({
    queryKey: ['collections', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .eq('user_id', user?.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) {
      toast.error("Please enter a collection name");
      return;
    }

    try {
      setIsCreating(true);
      const { data: collection, error: createError } = await supabase
        .from('collections')
        .insert({
          name: newCollectionName.trim(),
          user_id: user?.id
        })
        .select()
        .single();

      if (createError) throw createError;

      await supabase
        .from('collection_posts')
        .insert({
          collection_id: collection.id,
          post_id: postId
        });

      toast.success("Collection created and post added!");
      setNewCollectionName("");
      refetch();
      onSuccess();
    } catch (error) {
      toast.error("Error creating collection");
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddToCollection = async (collectionId: string) => {
    try {
      const { error } = await supabase
        .from('collection_posts')
        .insert({
          collection_id: collectionId,
          post_id: postId
        });

      if (error) throw error;
      onSuccess();
    } catch (error) {
      toast.error("Error adding to collection");
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Create New Collection</h3>
        <div className="flex gap-2">
          <Input
            placeholder="Collection name"
            value={newCollectionName}
            onChange={(e) => setNewCollectionName(e.target.value)}
          />
          <Button onClick={handleCreateCollection} disabled={isCreating}>
            <Plus className="w-4 h-4 mr-2" />
            Create
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Add to Existing Collection</h3>
        <div className="grid gap-2">
          {collections?.map((collection) => (
            <Button
              key={collection.id}
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleAddToCollection(collection.id)}
            >
              {collection.name}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CollectionSelector;