import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface UploadProgress {
  setProgress: (progress: number) => void;
}

interface UploadResult {
  url: string | null;
  error: Error | null;
}

export class MediaService {
  private static validateFile(file: File, type: 'image' | 'video'): string | null {
    const maxSize = type === 'image' ? 5000000 : 100000000; // 5MB for images, 100MB for videos
    const allowedTypes = {
      image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      video: ['video/mp4', 'video/webm', 'video/ogg']
    };

    if (file.size > maxSize) {
      return `${type === 'image' ? 'Image' : 'Video'} size should be less than ${maxSize / 1000000}MB`;
    }

    if (!allowedTypes[type].includes(file.type)) {
      return `Invalid ${type} format. Allowed formats: ${allowedTypes[type].join(', ')}`;
    }

    return null;
  }

  private static simulateProgress(setProgress: (progress: number) => void): NodeJS.Timer {
    return setInterval(() => {
      setProgress((prev) => Math.min(90, prev + Math.random() * 10));
    }, 500);
  }

  static async uploadImage(
    file: File,
    { setProgress }: UploadProgress
  ): Promise<UploadResult> {
    const validationError = this.validateFile(file, 'image');
    if (validationError) {
      toast.error(validationError);
      return { url: null, error: new Error(validationError) };
    }

    const progressInterval = this.simulateProgress(setProgress);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('posts')
        .upload(filePath, file);

      clearInterval(progressInterval);
      setProgress(100);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('posts')
        .getPublicUrl(filePath);

      return { url: publicUrl, error: null };
    } catch (error) {
      clearInterval(progressInterval);
      setProgress(0);
      toast.error("Failed to upload image");
      return { url: null, error: error as Error };
    }
  }

  static async uploadVideo(
    file: File,
    { setProgress }: UploadProgress
  ): Promise<UploadResult> {
    const validationError = this.validateFile(file, 'video');
    if (validationError) {
      toast.error(validationError);
      return { url: null, error: new Error(validationError) };
    }

    const progressInterval = this.simulateProgress(setProgress);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(filePath, file);

      clearInterval(progressInterval);
      setProgress(100);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(filePath);

      return { url: publicUrl, error: null };
    } catch (error) {
      clearInterval(progressInterval);
      setProgress(0);
      toast.error("Failed to upload video");
      return { url: null, error: error as Error };
    }
  }

  static async validateMediaUrl(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }
}