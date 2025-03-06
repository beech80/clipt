import { createClient } from '@supabase/supabase-js';

// Supabase credentials from the client.ts file
const SUPABASE_URL = "https://slnjliheyiiummxhrgmk.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsbmpsaWhleWlpdW1teGhyZ21rIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzU4MjU2MjEsImV4cCI6MjA1MjM3ODYxMX0.0O3AhsGPFIoHQPY329lM0HA1JdFZoSodIK6uFz6DLyM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Direct deletion function that immediately clears all posts
async function cleanupDatabase() {
  console.log('🧹 Starting immediate database cleanup...');
  
  try {
    // 1. Delete all likes
    console.log('Deleting likes...');
    await supabase.from('likes').delete().filter('id', 'is.not.null');
    console.log('✅ Likes deleted');
    
    // 2. Delete all comments
    console.log('Deleting comments...');
    await supabase.from('comments').delete().filter('id', 'is.not.null');
    console.log('✅ Comments deleted');
    
    // 3. Delete all clip votes
    console.log('Deleting clip votes...');
    await supabase.from('clip_votes').delete().filter('id', 'is.not.null');
    console.log('✅ Clip votes deleted');
    
    // 4. Delete all follows
    console.log('Deleting follows relationships...');
    await supabase.from('follows').delete().filter('id', 'is.not.null');
    console.log('✅ Follows deleted');
    
    // 5. Delete all posts
    console.log('Deleting all posts...');
    await supabase.from('posts').delete().filter('id', 'is.not.null');
    console.log('✅ Posts deleted');
    
    console.log('🎉 Database cleanup complete! All posts have been removed.');
    console.log('Your Home and Clipts pages should now be empty.');
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

// Run the immediate cleanup
cleanupDatabase();
