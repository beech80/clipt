import { createClient } from '@supabase/supabase-js';

// Supabase credentials
const SUPABASE_URL = "https://slnjliheyiiummxhrgmk.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsbmpsaWhleWlpdW1teGhyZ21rIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzU4MjU2MjEsImV4cCI6MjA1MjM3ODYxMX0.0O3AhsGPFIoHQPY329lM0HA1JdFZoSodIK6uFz6DLyM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

async function forceCleanup() {
  console.log('🔥 Starting FORCED cleanup...');
  
  try {
    // Target specific usernames we want to remove
    const usernamesToRemove = ['Tat123', 'blackchill 806'];
    
    console.log(`Targeting users: ${usernamesToRemove.join(', ')}`);
    
    // Find all profiles by the usernames
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, user_id, username')
      .or(`username.ilike.${usernamesToRemove[0]},username.ilike.${usernamesToRemove[1]}`);
    
    console.log(`Found ${profiles?.length || 0} matching profiles`);
    
    if (profiles && profiles.length > 0) {
      // For each profile, delete all their content
      for (const profile of profiles) {
        console.log(`Processing user: ${profile.username} (ID: ${profile.id})`);
        
        // Get all posts by this user
        const { data: posts } = await supabase
          .from('posts')
          .select('id')
          .eq('user_id', profile.user_id);
        
        console.log(`Found ${posts?.length || 0} posts for user ${profile.username}`);
        
        if (posts && posts.length > 0) {
          for (const post of posts) {
            // Delete all likes, comments, and votes for this post
            await supabase.from('likes').delete().eq('post_id', post.id);
            await supabase.from('comments').delete().eq('post_id', post.id);
            await supabase.from('clip_votes').delete().eq('post_id', post.id);
            
            // Delete the post itself
            await supabase.from('posts').delete().eq('id', post.id);
            console.log(`Deleted post: ${post.id}`);
          }
        }
      }
    }

    // Try a different method - check posts directly by title
    const gameTitles = ['Tim marvel', 'Madden 22', 'Clipt'];
    
    for (const title of gameTitles) {
      const { data: postsByGame } = await supabase
        .from('posts')
        .select('id')
        .ilike('game_title', `%${title}%`);
      
      console.log(`Found ${postsByGame?.length || 0} posts for game: ${title}`);
      
      if (postsByGame && postsByGame.length > 0) {
        for (const post of postsByGame) {
          // Delete all likes, comments, and votes for this post
          await supabase.from('likes').delete().eq('post_id', post.id);
          await supabase.from('comments').delete().eq('post_id', post.id);
          await supabase.from('clip_votes').delete().eq('post_id', post.id);
          
          // Delete the post itself
          await supabase.from('posts').delete().eq('id', post.id);
          console.log(`Deleted post with game title ${title}: ${post.id}`);
        }
      }
    }
    
    // Try a direct approach - get and delete ALL posts
    console.log('Attempting to delete ALL remaining posts...');
    const { data: allPosts } = await supabase
      .from('posts')
      .select('id');
    
    console.log(`Found ${allPosts?.length || 0} total posts remaining`);
    
    if (allPosts && allPosts.length > 0) {
      for (const post of allPosts) {
        // Delete all relations
        await supabase.from('likes').delete().eq('post_id', post.id);
        await supabase.from('comments').delete().eq('post_id', post.id);
        await supabase.from('clip_votes').delete().eq('post_id', post.id);
        
        // Delete the post
        await supabase.from('posts').delete().eq('id', post.id);
        console.log(`Deleted post: ${post.id}`);
      }
    }
    
    // Try the most direct method - truncate posts table (if possible)
    try {
      console.log('Attempting RPC method to delete all posts...');
      await supabase.rpc('truncate_posts_cascade');
      console.log('RPC truncate call attempt complete');
    } catch (rpcError) {
      console.log('RPC method unavailable or failed, continuing with standard methods');
    }
    
    console.log('🧹 All cleanup methods attempted.');
    console.log('✅ Force cleanup complete!');
    console.log('Check your app to confirm pages are now empty.');
  } catch (error) {
    console.error('Error during force cleanup:', error);
  }
}

// Run the cleanup
forceCleanup();
