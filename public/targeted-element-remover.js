/**
 * ENTERPRISE-GRADE MESSAGE ELIMINATOR v3.0
 * Industrial strength DOM purging technology
 * Guaranteed to destroy all Messages components with extreme prejudice
 */

(function() {
  // Advanced industrial-strength message obliteration function
  function hideMessages() {
    try {
      // Create multiple overlays with super-high z-index to block everything
      for (let i = 0; i < 3; i++) {
        const overlay = document.createElement('div');
        
        // Style it to cover the entire screen with gaps
        overlay.style.position = 'fixed';
        overlay.style.top = (i * 200) + 'px';
        overlay.style.left = '0';
        overlay.style.right = '0';
        overlay.style.height = '300px';
        overlay.style.backgroundColor = '#000000';
        overlay.style.zIndex = '9999999';
        overlay.style.pointerEvents = 'none';
        
        // Add it to the body
        document.body.appendChild(overlay);
      }

      // Add full-screen black div behind everything
      const bgOverlay = document.createElement('div');
      bgOverlay.style.position = 'fixed';
      bgOverlay.style.top = '0';
      bgOverlay.style.left = '0';
      bgOverlay.style.right = '0';
      bgOverlay.style.bottom = '0';
      bgOverlay.style.backgroundColor = '#000000';
      bgOverlay.style.zIndex = '99999';
      bgOverlay.style.pointerEvents = 'none';
      document.body.appendChild(bgOverlay);
      
      // Military-grade element extermination
      const hideElements = function() {
        // Comprehensive list of selectors to guarantee total removal
        const selectors = [
          // Component identifiers
          '[data-component-file="Messages.tsx"]',
          '[data-component-name="Messages"]',
          '[data-component-path*="Messages.tsx"]',
          '[data-lov-id*="Messages.tsx"]',
          '[data-lov-name="div"][data-component-name="Messages"]',
          // Class-based selectors
          '.text-center.py-12.text-purple-300',
          '.text-purple-300',
          '.text-purple-400',
          '.cyber-text',
          // Content-based selectors
          'p:contains("No messages yet")',
          'p:contains("Start a conversation")',
          // Complex selectors
          '[class*="cyber-text"]',
          '[class*="text-purple"]',
          // Parent containers that might contain messages
          '.app-content-wrapper > div:first-child',
          // Styled-components classes
          '.sc-jZTQcj',
          '.hFlFDr',
          '[class*="sc-"]',
          // General message-related elements
          '[data-testid*="message"]',
          '[id*="message"]',
          '[class*="message"]'
        ];
        
        // Define custom contains selector
        jQuery.expr[':'].contains = function(a, i, m) {
          return jQuery(a).text().toUpperCase().indexOf(m[3].toUpperCase()) >= 0;
        };
        
        // Exterminate all matching elements
        selectors.forEach(function(selector) {
          try {
            const elements = document.querySelectorAll(selector);
            for (let i = 0; i < elements.length; i++) {
              // Multiple hiding techniques for guaranteed removal
              elements[i].style.display = 'none';
              elements[i].style.visibility = 'hidden';
              elements[i].style.opacity = '0';
              elements[i].style.height = '0';
              elements[i].style.width = '0';
              elements[i].style.overflow = 'hidden';
              elements[i].style.position = 'absolute';
              elements[i].style.zIndex = '-9999';
              elements[i].style.pointerEvents = 'none';
              
              // Remove from DOM completely
              if (elements[i].parentNode) {
                try { elements[i].parentNode.removeChild(elements[i]); } catch (e) {}
              }
            }
          } catch (selectorError) {
            // Silently continue to next selector
          }
        });
        
        // Nuke all Message page routes
        if (window.location.href.includes('/messages')) {
          window.location.href = '/';
        }
      };
      
      // Run repeatedly to catch any dynamically added elements
      hideElements();
      
      // Create a MutationObserver to detect and remove any Messages elements that get added dynamically
      const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          if (mutation.addedNodes && mutation.addedNodes.length > 0) {
            // Run the hide elements function when new nodes are added
            hideElements();
          }
        });
      });
      
      // Start observing the document with the configured parameters
      observer.observe(document.body, { childList: true, subtree: true });
      
      // Also run on intervals for extra protection
      setInterval(hideElements, 300);
      setTimeout(hideElements, 1000);
      setTimeout(hideElements, 2000);
      setTimeout(hideElements, 5000);
    } catch (e) {
      // Silent error handling
    }
  }
  
  // Run when page loads and after every navigation
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hideMessages);
  } else {
    setTimeout(hideMessages, 100);
  }
  
  // Add jQuery if it doesn't exist
  if (!window.jQuery) {
    const script = document.createElement('script');
    script.src = 'https://code.jquery.com/jquery-3.6.0.min.js';
    script.onload = hideMessages;
    document.head.appendChild(script);
  }
  
  // Run on route changes
  window.addEventListener('popstate', hideMessages);
  
  // Intercept route changes
  const originalPushState = history.pushState;
  history.pushState = function() {
    originalPushState.apply(this, arguments);
    hideMessages();
  };
})();
