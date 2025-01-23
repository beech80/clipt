import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CollectionCard } from "@/components/collections/CollectionCard";
import { CollectionFilters } from "@/components/collections/CollectionFilters";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FolderPlus } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";

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
    <div className="min-h-screen bg-gaming-800 text-white">
      <div className="container mx-auto p-4 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <BackButton />
            <h1 className="text-3xl font-bold gaming-gradient-text">Collections</h1>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gaming-button">
                <FolderPlus className="h-4 w-4 mr-2" />
                New Collection
              </Button>
            </DialogTrigger>
            <DialogContent className="gaming-card">
              <div className="space-y-4 p-4">
                <div className="space-y-2">
                  <Label className="text-gaming-300">Collection Name</Label>
                  <Input
                    id="name"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    placeholder="Enter collection name"
                    className="gaming-input"
                  />
                </div>
                <Button onClick={handleCreateCollection} className="gaming-button w-full">
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
      </div>
    </div>
  );
};

export default Collections;