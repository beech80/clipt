/**
 * Simplified Messages Element Removal Script
 * Basic version to avoid any potential issues
 */

(function() {
  // Simple function to hide message elements
  function hideMessages() {
    try {
      // Basic class-based selectors only
      const selectors = [
        '.text-center.py-12.text-purple-300.cyber-text',
        '.text-purple-300',
        '.text-purple-400',
        '.cyber-text'
      ];
      
      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          // Just change styling instead of removing from DOM
          el.style.display = 'none';
          el.style.visibility = 'hidden';
          el.style.opacity = '0';
        });
      });
    } catch (e) {
      // Ignore errors
    }
  }
  
  // Run when DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hideMessages);
  } else {
    setTimeout(hideMessages, 500);
  }
})();
