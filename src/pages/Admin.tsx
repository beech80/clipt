import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Admin() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [progress, setProgress] = useState("");

  const deleteAllPosts = async () => {
    try {
      setIsDeleting(true);
      setProgress("Starting deletion process...");

      // Get all posts
      setProgress("Fetching all posts...");
      const { data: posts, error: postsError } = await supabase
        .from("posts")
        .select("id");

      if (postsError) {
        toast.error("Error fetching posts: " + postsError.message);
        return;
      }

      if (!posts || posts.length === 0) {
        setProgress("No posts found to delete!");
        toast.success("No posts found to delete");
        setIsDeleting(false);
        return;
      }

      setProgress(`Found ${posts.length} posts to delete. Starting deletion...`);
      
      // Process posts one by one
      let deletedCount = 0;
      
      for (const post of posts) {
        try {
          // Delete likes for this post
          await supabase.from("likes").delete().eq("post_id", post.id);
          
          // Delete comments for this post
          await supabase.from("comments").delete().eq("post_id", post.id);
          
          // Delete clip votes for this post
          await supabase.from("clip_votes").delete().eq("post_id", post.id);
          
          // Delete the post itself
          await supabase.from("posts").delete().eq("id", post.id);
          
          deletedCount++;
          setProgress(`Deleted ${deletedCount} of ${posts.length} posts...`);
        } catch (postError) {
          console.error(`Error deleting post ${post.id}:`, postError);
          // Continue with other posts
        }
      }

      setProgress("All posts have been deleted!");
      toast.success("Successfully deleted all posts and related data");
    } catch (error) {
      console.error("Error during deletion process:", error);
      toast.error("Error deleting posts");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Admin Dashboard</CardTitle>
          <CardDescription>
            Manage your Clipt app data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Database Management</h3>
              <p className="text-sm text-muted-foreground">
                Delete all posts and related data from the database
              </p>
            </div>
            
            {isDeleting && (
              <div className="flex items-center space-x-2 my-4 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                <p>{progress}</p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            variant="destructive" 
            onClick={deleteAllPosts}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete All Posts"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
