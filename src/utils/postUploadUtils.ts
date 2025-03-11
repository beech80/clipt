import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface UploadMediaResult {
  url: string | null;
  error: Error | null;
}

const FALLBACK_TO_STORAGE = true; // Set to true to fallback to Supabase Storage if Cloudinary fails

// Helper function to get public URL from Supabase Storage
const getPublicUrl = (bucket: string, path: string): string => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

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
    console.log('Starting video upload: ', file.name, file.type, file.size);
    setProgress(10);

    // Validate MIME type to ensure it's a video
    if (!file.type.startsWith('video/')) {
      console.error('Invalid file type:', file.type);
      return { 
        url: null, 
        error: new Error(`Invalid file type: ${file.type}. Expected video/*`) 
      };
    }

    // Create a unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `videos/${fileName}`;
    
    console.log('Uploading to path: ', filePath);
    setProgress(20);

    // Upload the file to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type // Explicitly set the content type
      });

    if (uploadError) {
      console.error('Video upload error:', uploadError);
      setProgress(0);
      return { url: null, error: uploadError };
    }

    setProgress(70);

    // Get the public URL
    const { data } = supabase.storage.from('media').getPublicUrl(filePath);
    if (!data || !data.publicUrl) {
      console.error('Failed to get public URL');
      return { url: null, error: new Error('Failed to get public URL for uploaded video') };
    }

    const fileUrl = data.publicUrl;
    console.log('Video upload complete, URL:', fileUrl);
    setProgress(100);
    
    return { url: fileUrl, error: null };
  } catch (err) {
    console.error('Unexpected error during video upload:', err);
    setProgress(0);
    return { url: null, error: err as Error };
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