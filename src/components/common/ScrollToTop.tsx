import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop component that scrolls the window to the top
 * whenever the route changes.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    console.log("ScrollToTop activated for path:", pathname);
    
    // Force scroll to top immediately
    window.scrollTo(0, 0);
    
    // Also ensure all scroll containers are reset
    document.querySelectorAll('.overflow-auto, .overflow-y-auto, .overflow-scroll, .overflow-y-scroll').forEach(element => {
      if (element instanceof HTMLElement) {
        element.scrollTop = 0;
      }
    });
    
    // Also handle any main content element
    const mainContent = document.querySelector('main');
    if (mainContent) {
      mainContent.scrollTop = 0;
    }
    
    console.log("Scrolling complete");
  }, [pathname]);

  return null; // This component doesn't render anything
};

export default ScrollToTop;
