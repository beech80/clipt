import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { CollectionCard } from "@/components/collections/CollectionCard";
import { CollectionFilters } from "@/components/collections/CollectionFilters";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface Collection {
  id: string;
  name: string;
  description: string | null;
  is_private: boolean;
  created_at: string;
  user_id: string;
  thumbnail_url: string | null;
  category: string;
  tags: string[];
  post_count?: number;
}

const Collections = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDescription, setNewCollectionDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("general");
  const [tags, setTags] = useState("");

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
          category: selectedCategory,
          tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
        });

      if (error) throw error;

      toast.success("Collection created successfully!");
      setNewCollectionName("");
      setNewCollectionDescription("");
      setIsPrivate(false);
      setSelectedCategory("general");
      setTags("");
    } catch (error) {
      console.error("Error creating collection:", error);
      toast.error("Failed to create collection");
    }
  };

  const filteredAndSortedCollections = collections
    ?.filter(collection =>
      (searchQuery
        ? collection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          collection.description?.toLowerCase().includes(searchQuery.toLowerCase())
        : true) &&
      (category !== "all"
        ? collection.category === category
        : true)
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "name":
          return a.name.localeCompare(b.name);
        case "posts":
          return (b.post_count || 0) - (a.post_count || 0);
        default: // newest
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

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
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="Collection name"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newCollectionDescription}
                  onChange={(e) => setNewCollectionDescription(e.target.value)}
                  placeholder="Collection description"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  placeholder="Collection category"
                />
              </div>
              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="tag1, tag2, tag3"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="private"
                  checked={isPrivate}
                  onCheckedChange={setIsPrivate}
                />
                <Label htmlFor="private">Make this collection private</Label>
              </div>
              <Button onClick={createCollection} className="w-full">
                Create Collection
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <CollectionFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        category={category}
        onCategoryChange={setCategory}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      {isLoading ? (
        <div className="text-center py-8">Loading collections...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {filteredAndSortedCollections?.map((collection) => (
            <CollectionCard
              key={collection.id}
              id={collection.id}
              name={collection.name}
              description={collection.description}
              isPrivate={collection.is_private}
              createdAt={collection.created_at}
              thumbnailUrl={collection.thumbnail_url}
              category={collection.category}
              tags={collection.tags}
              postCount={collection.post_count || 0}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Collections;