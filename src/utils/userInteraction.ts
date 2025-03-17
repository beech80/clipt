/**
 * Utility to detect and track user interaction with the site.
 * This helps with autoplay policies in browsers that require user interaction
 * before media can autoplay with sound.
 */

// Initialize user interaction tracking
export const initUserInteractionTracking = () => {
  // Only set up once
  if (typeof window === 'undefined' || document.documentElement.hasAttribute('data-user-interacted')) {
    return;
  }

  // List of events that indicate user interaction
  const interactionEvents = [
    'click',
    'touchstart', 
    'keydown', 
    'scroll', 
    'mousedown'
  ];

  const markUserInteracted = () => {
    // Set attribute to mark that user has interacted with the page
    document.documentElement.setAttribute('data-user-interacted', 'true');
    
    // Unmute any currently playing videos that are set to autoplay
    document.querySelectorAll<HTMLVideoElement>('video[autoplay]').forEach(video => {
      // Only unmute if it's currently muted
      if (video.muted) {
        // Try to unmute safely
        try {
          video.muted = false;
        } catch (e) {
          console.warn('Could not unmute video: ', e);
        }
      }
    });

    // Clean up event listeners after first interaction
    interactionEvents.forEach(event => {
      document.removeEventListener(event, markUserInteracted);
    });
  };

  // Add event listeners for user interaction
  interactionEvents.forEach(event => {
    document.addEventListener(event, markUserInteracted, { passive: true, once: true });
  });

  // Reset when the page is refreshed
  window.addEventListener('beforeunload', () => {
    document.documentElement.removeAttribute('data-user-interacted');
  });
};

// Check if the user has interacted with the page
export const hasUserInteracted = (): boolean => {
  return typeof document !== 'undefined' && 
    document.documentElement.hasAttribute('data-user-interacted');
};
