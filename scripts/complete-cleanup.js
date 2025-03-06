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

// Get all post IDs by type
async function getPostIdsByType(postType) {
  const { data } = await supabase
    .from('posts')
    .select('id')
    .eq('post_type', postType);
  
  return data || [];
}

// Delete all related data for a post
async function cleanPostRelations(postId) {
  console.log(`Cleaning relations for post ${postId}...`);
  
  // Delete in sequence to respect foreign key constraints
  await supabase.from('likes').delete().eq('post_id', postId);
  await supabase.from('comments').delete().eq('post_id', postId);
  await supabase.from('clip_votes').delete().eq('post_id', postId);
}

// Main cleanup function
async function runCompleteCleanup() {
  console.log('🧹 Starting COMPLETE database cleanup...');
  
  try {
    // 1. Target 'clipts' type posts
    console.log('🎯 Targeting CLIPTS posts...');
    const cliptsPosts = await getPostIdsByType('clipts');
    console.log(`Found ${cliptsPosts.length} clipts posts to delete`);
    
    for (const post of cliptsPosts) {
      await cleanPostRelations(post.id);
      await supabase.from('posts').delete().eq('id', post.id);
      console.log(`✅ Deleted clipts post: ${post.id}`);
    }
    
    // 2. Target 'home' type posts
    console.log('🎯 Targeting HOME posts...');
    const homePosts = await getPostIdsByType('home');
    console.log(`Found ${homePosts.length} home posts to delete`);
    
    for (const post of homePosts) {
      await cleanPostRelations(post.id);
      await supabase.from('posts').delete().eq('id', post.id);
      console.log(`✅ Deleted home post: ${post.id}`);
    }
    
    // 3. Delete any other posts without a type
    console.log('🎯 Targeting posts without a specific type...');
    const { data: otherPosts } = await supabase
      .from('posts')
      .select('id')
      .is('post_type', null);
    
    console.log(`Found ${otherPosts?.length || 0} posts without type to delete`);
    
    for (const post of otherPosts || []) {
      await cleanPostRelations(post.id);
      await supabase.from('posts').delete().eq('id', post.id);
      console.log(`✅ Deleted untyped post: ${post.id}`);
    }
    
    // 4. Clean up any orphaned relations
    console.log('🧹 Cleaning up orphaned relations...');
    await supabase.from('likes').delete().is('post_id', null);
    await supabase.from('comments').delete().is('post_id', null);
    await supabase.from('clip_votes').delete().is('post_id', null);
    
    // 5. Reset all follows data
    console.log('🧹 Cleaning up follows relationships...');
    await supabase.from('follows').delete().filter('id', 'is.not.null');
    
    console.log('🎉 Complete cleanup finished successfully!');
    console.log('Your Home and Clipts pages should now be completely empty.');
    console.log('Make sure to HARD REFRESH your browser to clear any cached data.');
  } catch (error) {
    console.error('Error during complete cleanup:', error);
  }
}

// Run the cleanup
runCompleteCleanup();
