import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Plus, Search, Folder, FolderOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

interface Collection {
  id: string;
  name: string;
  description: string | null;
  is_private: boolean;
  created_at: string;
  user_id: string;
  post_count?: number;
}

const Collections = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDescription, setNewCollectionDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isHovered, setIsHovered] = useState<string | null>(null);

  const { data: collections, isLoading } = useQuery({
    queryKey: ['collections', user?.id],
    queryFn: async () => {
      const { data: collectionsData, error: collectionsError } = await supabase
        .from('collections')
        .select('*, collection_posts(count)')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (collectionsError) throw collectionsError;

      return collectionsData.map(collection => ({
        ...collection,
        post_count: collection.collection_posts?.[0]?.count || 0
      })) as Collection[];
    },
    enabled: !!user,
  });

  const createCollection = async () => {
    if (!user) {
      toast.error("You must be logged in to create a collection");
      return;
    }

    if (!newCollectionName.trim()) {
      toast.error("Collection name is required");
      return;
    }

    try {
      const { error } = await supabase
        .from('collections')
        .insert({
          name: newCollectionName.trim(),
          description: newCollectionDescription.trim() || null,
          is_private: isPrivate,
          user_id: user.id,
        });

      if (error) throw error;

      toast.success("Collection created successfully!");
      setNewCollectionName("");
      setNewCollectionDescription("");
      setIsPrivate(false);
    } catch (error) {
      console.error("Error creating collection:", error);
      toast.error("Failed to create collection");
    }
  };

  const filteredCollections = collections?.filter(collection =>
    collection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    collection.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Collections</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Collection
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Collection</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1">
                  Name
                </label>
                <Input
                  id="name"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="Collection name"
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-1">
                  Description
                </label>
                <Input
                  id="description"
                  value={newCollectionDescription}
                  onChange={(e) => setNewCollectionDescription(e.target.value)}
                  placeholder="Collection description"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="private"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="private" className="text-sm">
                  Make this collection private
                </label>
              </div>
              <Button onClick={createCollection} className="w-full">
                Create Collection
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search collections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading collections...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCollections?.map((collection) => (
            <Card
              key={collection.id}
              className="transition-all duration-200 hover:shadow-lg"
              onMouseEnter={() => setIsHovered(collection.id)}
              onMouseLeave={() => setIsHovered(null)}
            >
              <CardHeader>
                <div className="flex items-center gap-2">
                  {isHovered === collection.id ? (
                    <FolderOpen className="h-6 w-6 text-primary" />
                  ) : (
                    <Folder className="h-6 w-6 text-primary" />
                  )}
                  <CardTitle>{collection.name}</CardTitle>
                </div>
                {collection.description && (
                  <CardDescription>{collection.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {collection.post_count} posts
                </p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <span className="text-xs text-muted-foreground">
                  {new Date(collection.created_at).toLocaleDateString()}
                </span>
                {collection.is_private && (
                  <span className="text-xs bg-secondary px-2 py-1 rounded">
                    Private
                  </span>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Collections;