import { createClient } from '@supabase/supabase-js';

// Supabase credentials
const SUPABASE_URL = "https://slnjliheyiiummxhrgmk.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsbmpsaWhleWlpdW1teGhyZ21rIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzU4MjU2MjEsImV4cCI6MjA1MjM3ODYxMX0.0O3AhsGPFIoHQPY329lM0HA1JdFZoSodIK6uFz6DLyM";

// Create a Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Emergency cleanup function to delete absolutely everything
async function emergencyCleanup() {
  console.log('🚨 EMERGENCY CLEANUP - DELETING ALL DATABASE CONTENT');
  
  try {
    // Hard delete ALL posts with no filters
    console.log('Attempting direct deletion of ALL posts...');
    const { data: allPosts, error: postsError } = await supabase
      .from('posts')
      .select('*');
      
    if (postsError) {
      console.error('Error fetching posts:', postsError);
    } else {
      console.log(`Found ${allPosts.length} total posts to delete`);
      
      // Log all post data to help understand what's in the database
      console.log('Post details:', allPosts.map(p => ({
        id: p.id,
        user_id: p.user_id,
        post_type: p.post_type,
        game_title: p.game_title
      })));
      
      // Delete each post one by one
      for (const post of allPosts) {
        console.log(`Removing post ID: ${post.id}, Game: ${post.game_title || 'Unknown'}`);
        
        // Delete all relations
        await supabase.from('likes').delete().eq('post_id', post.id);
        await supabase.from('comments').delete().eq('post_id', post.id);
        await supabase.from('clip_votes').delete().eq('post_id', post.id);
        
        // Delete the post itself
        const { error: deleteError } = await supabase.from('posts').delete().eq('id', post.id);
        
        if (deleteError) {
          console.error(`Failed to delete post ${post.id}:`, deleteError);
        } else {
          console.log(`✅ Successfully deleted post: ${post.id}`);
        }
      }
    }
    
    // Target the specific usernames seen in the screenshots
    console.log('Targeting specific users from screenshots...');
    const targetUsers = ['Tat123', 'blackchill 806'];
    
    for (const username of targetUsers) {
      // Find profiles with matching username
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', `%${username}%`);
      
      console.log(`Found ${profiles?.length || 0} profiles matching "${username}"`);
      
      // For each matching profile, find and delete their posts
      if (profiles && profiles.length > 0) {
        for (const profile of profiles) {
          const { data: userPosts } = await supabase
            .from('posts')
            .select('id')
            .eq('user_id', profile.id);
          
          console.log(`Found ${userPosts?.length || 0} posts for user "${profile.username}"`);
          
          if (userPosts && userPosts.length > 0) {
            for (const post of userPosts) {
              // Delete all relations
              await supabase.from('likes').delete().eq('post_id', post.id);
              await supabase.from('comments').delete().eq('post_id', post.id);
              await supabase.from('clip_votes').delete().eq('post_id', post.id);
              
              // Delete the post
              await supabase.from('posts').delete().eq('id', post.id);
              console.log(`✅ Deleted post ${post.id} by user ${profile.username}`);
            }
          }
        }
      }
    }
    
    // Target posts with specific game titles from screenshots
    console.log('Targeting posts with specific game titles...');
    const targetGames = ['Tim marvel', 'Madden 22'];
    
    for (const game of targetGames) {
      const { data: gamePosts } = await supabase
        .from('posts')
        .select('id')
        .ilike('game_title', `%${game}%`);
      
      console.log(`Found ${gamePosts?.length || 0} posts for game "${game}"`);
      
      if (gamePosts && gamePosts.length > 0) {
        for (const post of gamePosts) {
          // Delete all relations
          await supabase.from('likes').delete().eq('post_id', post.id);
          await supabase.from('comments').delete().eq('post_id', post.id);
          await supabase.from('clip_votes').delete().eq('post_id', post.id);
          
          // Delete the post
          await supabase.from('posts').delete().eq('id', post.id);
          console.log(`✅ Deleted post ${post.id} with game "${game}"`);
        }
      }
    }
    
    console.log('🧹 Emergency cleanup completed');
    console.log('⚠️ IMPORTANT: You must HARD REFRESH YOUR BROWSER or RESTART the app to see changes');
    
  } catch (error) {
    console.error('Error during emergency cleanup:', error);
  }
}

// Run the emergency cleanup
emergencyCleanup();
