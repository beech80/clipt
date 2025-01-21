export const getOptimizedImageUrl = (url: string, options: {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
} = {}) => {
  if (!url) return '';
  
  const { width, height, quality = 80, format = 'webp' } = options;
  const transformations: string[] = [];

  if (width) transformations.push(`width=${width}`);
  if (height) transformations.push(`height=${height}`);
  if (quality) transformations.push(`quality=${quality}`);
  if (format) transformations.push(`format=${format}`);

  // Only transform Supabase storage URLs
  if (url.includes('storage.googleapis.com')) {
    return `${url}?${transformations.join('&')}`;
  }

  return url;
};

export const preloadImage = (src: string) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = resolve;
    img.onerror = reject;
    img.src = src;
  });
};

export const getVideoThumbnail = async (videoUrl: string): Promise<string> => {
  try {
    const response = await fetch(videoUrl);
    const blob = await response.blob();
    const video = document.createElement('video');
    video.src = URL.createObjectURL(blob);
    
    return new Promise((resolve) => {
      video.addEventListener('loadeddata', () => {
        video.currentTime = 1; // Get thumbnail from 1 second in
      });
      
      video.addEventListener('seeked', () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      });
    });
  } catch (error) {
    console.error('Error generating video thumbnail:', error);
    return '';
  }
};