import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface UploadMediaResult {
  url: string | null;
  error: Error | null;
}

export const uploadImage = async (
  file: File,
  setProgress: (progress: number) => void
): Promise<UploadMediaResult> => {
  try {
    setProgress(10);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('resourceType', 'image');
    formData.append('folder', 'posts');

    const { data: { url }, error } = await supabase.functions.invoke('cloudinary-upload', {
      body: formData,
    });

    if (error) throw error;
    setProgress(100);

    return { url, error: null };
  } catch (error) {
    console.error('Error uploading image:', error);
    return { url: null, error: error as Error };
  }
};

export const uploadVideo = async (
  file: File,
  setProgress: (progress: number) => void
): Promise<UploadMediaResult> => {
  try {
    setProgress(10);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('resourceType', 'video');
    formData.append('folder', 'videos');

    const { data: { url }, error } = await supabase.functions.invoke('cloudinary-upload', {
      body: formData,
    });

    if (error) throw error;
    setProgress(100);

    return { url, error: null };
  } catch (error) {
    console.error('Error uploading video:', error);
    return { url: null, error: error as Error };
  }
};