import { useEffect } from 'react';

/**
 * A hook that locks the body scrolling when the component mounts
 * and restores it when the component unmounts.
 */
export function useGlobalScrollLock() {
  useEffect(() => {
    // Save the original values
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalHeight = document.body.style.height;
    
    // Apply scroll lock and fix position
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'relative';
    document.body.style.height = '100vh';
    
    // Try to hide developer tools if present
    try {
      const devElements = document.querySelectorAll('[id*="developer"]');
      devElements.forEach(el => {
        if (el instanceof HTMLElement) {
          el.style.display = 'none';
        }
      });
    } catch (e) {
      console.log('Error hiding developer tools');
    }
    
    // Return a cleanup function to restore original styles when the component unmounts
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.height = originalHeight;
    };
  }, []);
}
