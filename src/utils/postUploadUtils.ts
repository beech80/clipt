import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface UploadMediaResult {
  url: string | null;
  error: Error | null;
}

const FALLBACK_TO_STORAGE = true; // Set to true to fallback to Supabase Storage if Cloudinary fails

export const uploadImage = async (
  file: File,
  setProgress: (progress: number) => void
): Promise<UploadMediaResult> => {
  try {
    setProgress(10);
    
    // Try Cloudinary upload first
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('resourceType', 'image');
      formData.append('folder', 'posts');

      setProgress(30);
      console.log('Uploading image to Cloudinary...');
      
      const { data, error } = await supabase.functions.invoke('cloudinary-upload', {
        body: formData,
      });

      if (error) throw error;
      
      setProgress(100);
      console.log('Successfully uploaded image to Cloudinary:', data.url);
      return { url: data.url, error: null };
    } catch (cloudinaryError) {
      console.warn('Cloudinary upload failed, falling back to Supabase Storage:', cloudinaryError);
      
      // If configured to fallback, try Supabase Storage
      if (!FALLBACK_TO_STORAGE) throw cloudinaryError;
      
      return await uploadToSupabaseStorage(file, 'images', setProgress);
    }
  } catch (error) {
    console.error('Error uploading image:', error);
    setProgress(0);
    return { url: null, error: error as Error };
  }
};

export const uploadVideo = async (
  file: File,
  setProgress: (progress: number) => void
): Promise<UploadMediaResult> => {
  try {
    setProgress(10);
    
    // Try Cloudinary upload first
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('resourceType', 'video');
      formData.append('folder', 'videos');

      setProgress(30);
      console.log('Uploading video to Cloudinary...');
      
      const { data, error } = await supabase.functions.invoke('cloudinary-upload', {
        body: formData,
      });

      if (error) throw error;
      
      setProgress(100);
      console.log('Successfully uploaded video to Cloudinary:', data.url);
      return { url: data.url, error: null };
    } catch (cloudinaryError) {
      console.warn('Cloudinary upload failed, falling back to Supabase Storage:', cloudinaryError);
      
      // If configured to fallback, try Supabase Storage
      if (!FALLBACK_TO_STORAGE) throw cloudinaryError;
      
      return await uploadToSupabaseStorage(file, 'videos', setProgress);
    }
  } catch (error) {
    console.error('Error uploading video:', error);
    setProgress(0);
    return { url: null, error: error as Error };
  }
};

// Helper function to upload media to Supabase Storage
async function uploadToSupabaseStorage(
  file: File, 
  bucket: string,
  setProgress: (progress: number) => void
): Promise<UploadMediaResult> {
  try {
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const filePath = `${timestamp}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    
    setProgress(40);
    console.log(`Uploading to Supabase Storage (${bucket})...`);

    const { error: uploadError, data: uploadData } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase Storage upload error:', uploadError);
      throw uploadError;
    }

    setProgress(80);
    console.log('File uploaded to Supabase Storage:', uploadData);

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    setProgress(100);
    console.log('Public URL:', publicUrl);
    
    return { url: publicUrl, error: null };
  } catch (error) {
    console.error('Error in Supabase Storage upload:', error);
    return { url: null, error: error as Error };
  }
}