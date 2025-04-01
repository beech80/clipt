import { supabase } from './supabase';

// Create a bucket if it doesn't exist
export const createBucketIfNotExists = async () => {
  const { data: buckets } = await supabase.storage.listBuckets();
  
  if (!buckets?.find(b => b.name === 'posts')) {
    const { error } = await supabase.storage.createBucket('posts', {
      public: true,
      fileSizeLimit: 52428800, // 50MB (increased from 5MB)
    });
    
    if (error) {
      console.error('Error creating bucket:', error);
    }
  }
};

// Call this when the app starts
createBucketIfNotExists();