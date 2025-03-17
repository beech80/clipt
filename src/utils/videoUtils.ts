/**
 * Utility functions for video processing
 */

/**
 * Get the correct URL with extension for videos
 * This handles cases where the URL might be missing extension or have MIME type issues
 * 
 * @param url Original video URL
 * @returns Corrected URL with proper extension if needed
 */
export const getVideoUrlWithProperExtension = (url: string): string => {
  if (!url) return '';
  
  try {
    // Parse the URL to get components
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    
    // If URL already has a video extension, use it as is
    if (/\.(mp4|webm|mov|m3u8|ogv)$/i.test(path)) {
      return url;
    }
    
    // If no extension, append .mp4 to help browser identify content type
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}format=mp4`;
  } catch (err) {
    console.error('Error parsing video URL:', err);
    return url;
  }
};

/**
 * Generate alternative video URLs to try if the main one fails
 * 
 * @param url Original video URL
 * @returns Array of alternative URLs to try
 */
export const getAlternativeVideoUrls = (url: string): string[] => {
  if (!url) return [];
  
  const alternativeUrls: string[] = [];
  
  try {
    // Parse the URL
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    
    // Base URL without query parameters
    const baseUrl = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
    
    // If URL has an extension, create a version without it
    const extensionMatch = path.match(/\.(mp4|webm|mov|m3u8|ogv)$/i);
    if (extensionMatch) {
      const withoutExtension = baseUrl.substring(0, baseUrl.lastIndexOf('.'));
      alternativeUrls.push(withoutExtension);
      
      // Try different extensions
      alternativeUrls.push(`${withoutExtension}.mp4`);
      alternativeUrls.push(`${withoutExtension}.webm`);
    } else {
      // If no extension, try adding common video extensions
      alternativeUrls.push(`${baseUrl}.mp4`);
      alternativeUrls.push(`${baseUrl}.webm`);
    }
    
    // Add a cachebuster version
    const cacheBuster = `t=${Date.now()}`;
    const separator = url.includes('?') ? '&' : '?';
    alternativeUrls.push(`${url}${separator}${cacheBuster}`);
    
  } catch (err) {
    console.error('Error generating alternative video URLs:', err);
  }
  
  return alternativeUrls;
};

/**
 * Check if the URL is accessible
 * 
 * @param url URL to check
 * @returns Promise resolving to boolean indicating if the URL is accessible
 */
export const isUrlAccessible = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      mode: 'no-cors' // This allows checking cross-origin URLs
    });
    return true;
  } catch (err) {
    console.error(`URL ${url} is not accessible:`, err);
    return false;
  }
};
