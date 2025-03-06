import { createClient } from '@supabase/supabase-js';

// Supabase credentials from the client.ts file
const SUPABASE_URL = "https://slnjliheyiiummxhrgmk.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsbmpsaWhleWlpdW1teGhyZ21rIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzU4MjU2MjEsImV4cCI6MjA1MjM3ODYxMX0.0O3AhsGPFIoHQPY329lM0HA1JdFZoSodIK6uFz6DLyM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function clearAllPosts() {
  try {
    console.log('Starting deletion process...');
    
    console.log('Getting all posts...');
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id');
    
    if (postsError) {
      console.error('Error fetching posts:', postsError);
      return;
    }
    
    console.log(`Found ${posts.length} posts to delete`);
    
    // Delete related data for each post
    for (const post of posts) {
      // Delete likes for this post
      await supabase.from('likes').delete().eq('post_id', post.id);
      
      // Delete comments for this post
      await supabase.from('comments').delete().eq('post_id', post.id);
      
      // Delete clip votes for this post
      await supabase.from('clip_votes').delete().eq('post_id', post.id);
      
      // Delete the post itself
      await supabase.from('posts').delete().eq('id', post.id);
      
      console.log(`Deleted post ID: ${post.id}`);
    }
    
    console.log('All posts and related data have been deleted!');
  } catch (error) {
    console.error('Error during deletion process:', error);
  }
}

// Run the function
clearAllPosts();
