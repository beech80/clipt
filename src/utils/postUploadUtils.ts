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
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random()}.${fileExt}`;
  const filePath = `${fileName}`;

  const imageInterval = setInterval(() => {
    setProgress(Math.min(90, Math.random() * 90));
  }, 500);

  try {
    const { error: uploadError, data } = await supabase.storage
      .from('posts')
      .upload(filePath, file);

    clearInterval(imageInterval);
    setProgress(100);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('posts')
      .getPublicUrl(filePath);

    return { url: publicUrl, error: null };
  } catch (error) {
    return { url: null, error: error as Error };
  }
};

export const uploadVideo = async (
  file: File,
  setProgress: (progress: number) => void
): Promise<UploadMediaResult> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random()}.${fileExt}`;
  const filePath = `${fileName}`;

  const videoInterval = setInterval(() => {
    setProgress(Math.min(90, Math.random() * 90));
  }, 500);

  try {
    const { error: uploadError } = await supabase.storage
      .from('videos')
      .upload(filePath, file);

    clearInterval(videoInterval);
    setProgress(100);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('videos')
      .getPublicUrl(filePath);

    return { url: publicUrl, error: null };
  } catch (error) {
    return { url: null, error: error as Error };
  }
};