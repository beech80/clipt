/**
 * Direct Overlay Creator
 * This script creates an absolutely positioned black overlay that covers
 * the orange messages box completely.
 */

(function() {
  // Create a black overlay element positioned exactly over the orange message area
  function createBlackOverlay() {
    try {
      // Create overlay element
      const overlay = document.createElement('div');
      
      // Set styles for complete coverage of the orange box
      Object.assign(overlay.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        height: '300px', // Tall enough to cover the orange box
        backgroundColor: '#000000', // Pure black
        zIndex: '99999999', // Ultra-high z-index
        pointerEvents: 'none', // Allow clicking through
      });
      
      // Prevent any possible animations or transitions
      overlay.style.transition = 'none';
      overlay.style.animation = 'none';
      overlay.style.transform = 'none';
      
      // Add custom element attribute for identification
      overlay.setAttribute('data-purpose', 'message-box-overlay');
      
      // Add to body at the top of all content
      document.body.insertBefore(overlay, document.body.firstChild);
      
      console.log('Black overlay created to mask orange message box');
    } catch (e) {
      // Silent error handling
    }
  }
  
  // Function to directly target and hide all Messages-related elements
  function directlyHideMessages() {
    try {
      // Find elements with purple or cyber text classes
      const selectors = [
        '.text-center.py-12.text-purple-300.cyber-text',
        '.text-purple-300',
        '.text-purple-400',
        '.cyber-text',
        '[data-component-file="Messages.tsx"]',
        '[data-component-path*="Messages.tsx"]'
      ];
      
      // Apply styles to each matching element
      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          // Set all properties to hide it
          el.style.display = 'none';
          el.style.visibility = 'hidden';
          el.style.opacity = '0';
          el.style.height = '0';
          el.style.width = '0';
          el.style.overflow = 'hidden';
          el.style.padding = '0';
          el.style.margin = '0';
          el.style.position = 'absolute';
          el.style.left = '-9999px';
          el.style.clip = 'rect(0, 0, 0, 0)';
          el.style.border = '0';
        });
      });
    } catch (e) {
      // Silent error handling
    }
  }
  
  // Run when DOM is ready or now if already loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      createBlackOverlay();
      directlyHideMessages();
    });
  } else {
    createBlackOverlay();
    directlyHideMessages();
  }
  
  // Re-apply overlay after any potential DOM updates
  setTimeout(createBlackOverlay, 500);
  setTimeout(createBlackOverlay, 1000);
  setTimeout(createBlackOverlay, 2000);
  
  // Add black background to pages
  document.body.style.backgroundColor = '#000000';
})();
