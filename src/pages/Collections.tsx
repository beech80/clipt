import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CollectionCard } from "@/components/collections/CollectionCard";
import { CollectionFilters } from "@/components/collections/CollectionFilters";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FolderPlus, Loader2 } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import GameBoyControls from '@/components/GameBoyControls';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const Collections = () => {
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDesc, setNewCollectionDesc] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const { data: collections, isLoading } = useQuery({
    queryKey: ['collections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collections')
        .select(`
          *,
          collection_posts (
            count
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const handleCreateCollection = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to create a collection");
        return;
      }

      const { error } = await supabase
        .from('collections')
        .insert({
          name: newCollectionName,
          description: newCollectionDesc,
          user_id: user.id,
          category: 'general'
        });

      if (error) throw error;

      toast.success("Collection created successfully!");
      setNewCollectionName("");
      setNewCollectionDesc("");
    } catch (error) {
      toast.error("Failed to create collection");
      console.error("Error creating collection:", error);
    }
  };

  const filteredCollections = collections?.filter(collection => {
    const matchesSearch = collection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         collection.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = category === "all" || collection.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="container mx-auto p-4 space-y-4 pb-40 min-h-screen bg-[#1A1F2C]">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <BackButton />
          <h1 className="text-2xl font-bold text-gaming-100">Collections</h1>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-gaming-400/20 hover:bg-gaming-400/30 text-gaming-400">
              <FolderPlus className="h-4 w-4 mr-2" />
              New Collection
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gaming-900/95 border-gaming-400/30">
            <DialogHeader>
              <DialogTitle>Create New Collection</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 p-4">
              <div className="space-y-2">
                <Label htmlFor="name">Collection Name</Label>
                <Input
                  id="name"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="Enter collection name"
                  className="bg-gaming-400/10 border-gaming-400/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newCollectionDesc}
                  onChange={(e) => setNewCollectionDesc(e.target.value)}
                  placeholder="Enter collection description"
                  className="bg-gaming-400/10 border-gaming-400/30"
                />
              </div>
              <Button 
                onClick={handleCreateCollection} 
                className="w-full bg-gaming-400/20 hover:bg-gaming-400/30 text-gaming-400"
              >
                Create Collection
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-gaming-900/95 border border-gaming-400/30 backdrop-blur-sm rounded-lg p-4">
        <CollectionFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          category={category}
          onCategoryChange={setCategory}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <Loader2 className="w-8 h-8 animate-spin text-gaming-400" />
        </div>
      ) : filteredCollections?.length === 0 ? (
        <div className="text-center p-8 bg-gaming-900/95 border border-gaming-400/30 backdrop-blur-sm rounded-lg">
          <FolderPlus className="w-12 h-12 mx-auto text-gaming-400 mb-4" />
          <h3 className="text-lg font-semibold text-gaming-100">No collections found</h3>
          <p className="text-gaming-400">Create your first collection to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCollections?.map((collection) => (
            <CollectionCard
              key={collection.id}
              id={collection.id}
              name={collection.name}
              description={collection.description}
              isPrivate={collection.is_private}
              createdAt={collection.created_at}
              category={collection.category}
              tags={collection.tags || []}
              postCount={collection.collection_posts?.[0]?.count || 0}
            />
          ))}
        </div>
      )}
      
      <GameBoyControls />
    </div>
  );
};

export default Collections;