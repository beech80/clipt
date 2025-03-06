import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, RefreshCw, Trash } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Admin() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingUsers, setIsDeletingUsers] = useState(false);
  const [progress, setProgress] = useState("");
  const [userProgress, setUserProgress] = useState("");

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
        setIsDeleting(false);
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

      // Delete follows data
      setProgress("Deleting all follows data...");
      await supabase.from("follows").delete().filter('id', 'is.not.null');

      setProgress("All posts and relationships have been deleted!");
      toast.success("Successfully deleted all posts and related data");
    } catch (error) {
      console.error("Error during deletion process:", error);
      toast.error("Error deleting posts");
    } finally {
      setIsDeleting(false);
    }
  };

  const resetAllUserData = async () => {
    try {
      if (!confirm("WARNING: This will delete ALL user accounts except for the admin account. This action cannot be undone. Are you sure you want to proceed?")) {
        return;
      }

      setIsDeletingUsers(true);
      setUserProgress("Starting user data reset process...");

      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        toast.error("You must be logged in to perform this action");
        setIsDeletingUsers(false);
        return;
      }

      // Get all profiles except current user
      setUserProgress("Fetching all user profiles...");
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, user_id")
        .neq("user_id", currentUser.id);

      if (profilesError) {
        toast.error("Error fetching profiles: " + profilesError.message);
        setIsDeletingUsers(false);
        return;
      }

      if (!profiles || profiles.length === 0) {
        setUserProgress("No other user profiles found to delete!");
        toast.success("No other user profiles found to delete");
        setIsDeletingUsers(false);
        return;
      }

      setUserProgress(`Found ${profiles.length} user profiles to delete. Starting deletion...`);
      
      // Process users one by one
      let deletedCount = 0;
      
      for (const profile of profiles) {
        try {
          // Delete user's posts
          const { data: userPosts } = await supabase
            .from("posts")
            .select("id")
            .eq("user_id", profile.user_id);

          if (userPosts && userPosts.length > 0) {
            for (const post of userPosts) {
              // Delete post relationships
              await supabase.from("likes").delete().eq("post_id", post.id);
              await supabase.from("comments").delete().eq("post_id", post.id);
              await supabase.from("clip_votes").delete().eq("post_id", post.id);
              
              // Delete the post
              await supabase.from("posts").delete().eq("id", post.id);
            }
          }
          
          // Delete user's relationships
          await supabase.from("follows").delete().eq("follower_id", profile.user_id);
          await supabase.from("follows").delete().eq("following_id", profile.user_id);
          await supabase.from("likes").delete().eq("user_id", profile.user_id);
          await supabase.from("comments").delete().eq("user_id", profile.user_id);
          await supabase.from("clip_votes").delete().eq("user_id", profile.user_id);
          
          // Delete profile
          await supabase.from("profiles").delete().eq("id", profile.id);
          
          // Attempt to delete auth user (may fail if not admin)
          const { error: authError } = await supabase.auth.admin.deleteUser(profile.user_id);
          if (authError) {
            console.warn(`Could not delete auth user ${profile.user_id}: ${authError.message}`);
          }
          
          deletedCount++;
          setUserProgress(`Deleted ${deletedCount} of ${profiles.length} user profiles...`);
        } catch (userError) {
          console.error(`Error deleting user ${profile.id}:`, userError);
          // Continue with other users
        }
      }

      setUserProgress("All user profiles and related data have been deleted!");
      toast.success("Successfully deleted all user profiles and related data except your own");
    } catch (error) {
      console.error("Error during user reset process:", error);
      toast.error("Error deleting user profiles");
    } finally {
      setIsDeletingUsers(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="space-y-6">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trash className="h-5 w-5 mr-2" /> 
              Content Cleanup
            </CardTitle>
            <CardDescription>
              Remove all posts and related content from the database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4 bg-amber-500/10 border-amber-500/20">
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                This will permanently delete all posts, comments, likes, and trophies.
                This action cannot be undone.
              </AlertDescription>
            </Alert>
            
            {isDeleting && (
              <div className="flex items-center space-x-2 my-4 text-sm bg-gray-800 p-3 rounded">
                <Loader2 className="h-4 w-4 animate-spin" />
                <p>{progress}</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              variant="destructive" 
              onClick={deleteAllPosts}
              disabled={isDeleting || isDeletingUsers}
              className="w-full sm:w-auto"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting Content...
                </>
              ) : (
                "Delete All Content"
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center">
              <RefreshCw className="h-5 w-5 mr-2" /> 
              Reset User Data
            </CardTitle>
            <CardDescription>
              Delete all user profiles and accounts (except your own)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4 bg-red-500/10 border-red-500/20">
              <AlertTitle>Danger Zone</AlertTitle>
              <AlertDescription>
                This will permanently delete all user accounts except yours.
                All user data, posts, and relationships will be removed.
                This action cannot be undone.
              </AlertDescription>
            </Alert>
            
            {isDeletingUsers && (
              <div className="flex items-center space-x-2 my-4 text-sm bg-gray-800 p-3 rounded">
                <Loader2 className="h-4 w-4 animate-spin" />
                <p>{userProgress}</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              variant="destructive" 
              onClick={resetAllUserData}
              disabled={isDeleting || isDeletingUsers}
              className="w-full sm:w-auto"
            >
              {isDeletingUsers ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting Users...
                </>
              ) : (
                "Reset All User Data"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
