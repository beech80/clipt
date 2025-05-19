/**
 * TARGETED ELEMENT DESTROYER
 * This script specifically targets and removes the blue line and purple circle
 * using direct DOM manipulation and mutation observers
 */

(function() {
  // Wait for DOM to be ready
  function whenDocumentReady(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  // The direct element killer function
  function killSpecificElements() {
    console.log('Hunting for annoying elements...');
    
    // APPROACH 1: Direct targeting with simple selectors
    const elementsToRemove = [
      // Scanline (blue horizontal line) selectors
      '.scanline', 
      '[class*="scanline"]',
      'div.scanline',
      'div[class*="scanline"]',
      // Purple circle selectors
      '.aurora',
      '[class*="aurora"]',
      '.animated-bg::before',
      '.animated-bg::after',
      '[class*="animated-bg"]::before',
      '[class*="animated-bg"]::after',
      '[style*="radial-gradient"]',
      '[style*="rgba(147, 51, 234"]'
    ];
    
    elementsToRemove.forEach(selector => {
      try {
        document.querySelectorAll(selector).forEach(el => {
          console.log('Removing element with selector:', selector);
          el.remove();
        });
      } catch (e) {
        console.log('Error with selector:', selector);
      }
    });
    
    // APPROACH 2: Target body's direct children by numerical index
    // Often, these elements are at fixed positions in the DOM tree
    try {
      const bodyChildren = document.body.children;
      
      // Typical indices where these elements might be found
      const possibleIndices = [2, 3, 4, 5];
      
      for (let i of possibleIndices) {
        if (bodyChildren[i]) {
          // Check for scanline characteristics
          const el = bodyChildren[i];
          const styles = window.getComputedStyle(el);
          
          // Is this element thin and horizontal? (likely a scanline)
          if (parseInt(styles.height) < 5 && styles.position === 'fixed') {
            console.log('Found potential scanline at body child index:', i);
            el.remove();
          }
          
          // Is this element creating a purple overlay?
          if (styles.background.includes('radial-gradient') || 
              styles.backgroundColor.includes('rgba(147') ||
              styles.backgroundColor.includes('rgb(147')) {
            console.log('Found potential purple circle at body child index:', i);
            el.remove();
          }
        }
      }
    } catch (e) {
      console.log('Error removing body children', e);
    }
    
    // APPROACH 3: Brute force scanning of ALL elements
    document.querySelectorAll('*').forEach(el => {
      try {
        const styles = window.getComputedStyle(el);
        
        // Check for scanline-like elements
        if (parseInt(styles.height) < 5 && 
            styles.position === 'fixed' && 
            styles.width === '100%') {
          console.log('Removing potential scanline:', el);
          el.remove();
        }
        
        // Check for purple radial gradients
        if (styles.background.includes('radial-gradient') && 
            (styles.background.includes('rgb(147') || 
             styles.background.includes('purple'))) {
          console.log('Removing purple gradient element:', el);
          el.remove();
        }
        
        // Override any animation
        el.style.animation = 'none !important';
      } catch (e) {
        // Silently continue if we can't check an element
      }
    });
    
    // APPROACH 4: Add a final override style
    const finalKillerStyle = document.createElement('style');
    finalKillerStyle.innerHTML = `
      /* Ultimate scanline killer */
      .scanline, div.scanline, [class*="scanline"] {
        display: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
        height: 0 !important;
        pointer-events: none !important;
        z-index: -9999 !important;
      }
      
      /* Ultimate purple circle killer */
      .aurora, div.aurora, [class*="aurora"],
      .animated-bg::before, .animated-bg::after,
      [class*="animated-bg"]::before, [class*="animated-bg"]::after,
      div[style*="radial-gradient"] {
        display: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
        background: none !important;
      }
      
      /* Animation stoppers */
      @keyframes scan { 0% { opacity: 0 !important; } 100% { opacity: 0 !important; } }
    `;
    document.head.appendChild(finalKillerStyle);
  }
  
  // Use MutationObserver to keep watching for any new elements that might appear
  function setupMutationObserver() {
    // Create an observer instance
    const observer = new MutationObserver(function(mutations) {
      killSpecificElements();
    });
    
    // Start observing the document with the configured parameters
    observer.observe(document.body, { 
      childList: true, 
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });
  }
  
  // Call our functions to eliminate the elements
  whenDocumentReady(function() {
    // First pass when document is ready
    killSpecificElements();
    
    // Set up observer to keep killing new elements
    setupMutationObserver();
    
    // Also run a few times after initial load to catch dynamically added elements
    setTimeout(killSpecificElements, 500);
    setTimeout(killSpecificElements, 1000);
    setTimeout(killSpecificElements, 2000);
  });
  
  // Run immediately as well, in case document is already loaded
  killSpecificElements();
})();
