import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CollectionCard } from "@/components/collections/CollectionCard";
import { CollectionFilters } from "@/components/collections/CollectionFilters";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FolderPlus } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import GameBoyControls from '@/components/GameBoyControls';

const Collections = () => {
  const [newCollectionName, setNewCollectionName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const handleCreateCollection = () => {
    // Implementation for creating collection
    setNewCollectionName("");
  };

  return (
    <div className="container mx-auto p-4 space-y-4 pb-40">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <BackButton />
          <h1 className="text-2xl font-bold">Collections</h1>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <FolderPlus className="h-4 w-4 mr-2" />
              New Collection
            </Button>
          </DialogTrigger>
          <DialogContent>
            <div className="space-y-4 p-4">
              <div className="space-y-2">
                <Label htmlFor="name">Collection Name</Label>
                <Input
                  id="name"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="Enter collection name"
                />
              </div>
              <Button onClick={handleCreateCollection} className="w-full">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <CollectionCard
          id="1"
          name="Sample Collection"
          description="This is a sample collection"
          isPrivate={false}
          createdAt={new Date().toISOString()}
          category="general"
          tags={["sample"]}
          postCount={0}
        />
      </div>
      
      <GameBoyControls />
    </div>
  );
};

export default Collections;
