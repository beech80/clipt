/**
 * NUCLEAR ANIMATION KILLER
 * This script runs immediately when the page loads and:
 * 1. Forcibly removes any scanline elements (blue horizontal line)
 * 2. Forcibly removes any purple circle elements
 * 3. Overrides CSS properties to prevent animations
 * 4. Sets up a continuous monitor to remove elements if they reappear
 */

(function() {
  // Function to kill all animations and problematic elements
  function killAllAnimations() {
    // 1. Find and remove all scanline elements (cause of blue line)
    const scanlineSelectors = [
      '.scanline',
      '[class*="scanline"]',
      '.gaming-scanline',
      '.scan-line',
      '[class*="scan-line"]',
      '.horizontal-line',
      '[class*="horizontal-line"]'
    ];
    
    // 2. Find and remove all purple circle elements
    const purpleCircleSelectors = [
      '.aurora',
      '[class*="aurora"]',
      '.animated-bg::before',
      '.animated-bg::after',
      '[class*="animated-bg"]::before',
      '[class*="animated-bg"]::after',
      '[style*="radial-gradient"]',
      '[style*="#9333ea"]',
      '[style*="rgba(147, 51, 234"]',
      '[style*="rgba(111, 66, 193"]',
      '.cosmic-overlay',
      '[class*="cosmic-overlay"]',
      '.empty-state::before',
      '.cosmic-glow',
      '[class*="cosmic-glow"]',
      '[class*="circle"]',
      '[class*="gradient-overlay"]'
    ];
    
    // Combine all selectors
    const allSelectors = [...scanlineSelectors, ...purpleCircleSelectors];
    
    // Process each selector
    allSelectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          // Try to completely remove it
          if (el.parentNode) {
            el.parentNode.removeChild(el);
          } else {
            // If we can't remove it, make it invisible
            el.style.display = 'none';
            el.style.opacity = '0';
            el.style.visibility = 'hidden';
            el.style.width = '0';
            el.style.height = '0';
            el.style.animation = 'none';
            el.style.background = 'none';
            el.style.zIndex = '-9999';
          }
        });
      } catch (e) {
        console.log('Error with selector:', selector, e);
      }
    });
    
    // Extreme measure: Remove specific elements by index position
    // Often the scanline is the 4th direct child of body and
    // the purple circle is the 2nd or 3rd
    try {
      const bodyChildren = document.body.children;
      // Remove potential scanline (usually 4th child)
      if (bodyChildren.length > 3) {
        const possibleScanline = bodyChildren[3];
        possibleScanline.style.display = 'none';
        possibleScanline.style.opacity = '0';
        possibleScanline.style.visibility = 'hidden';
      }
      
      // Remove potential purple circles (2nd and 3rd children)
      if (bodyChildren.length > 2) {
        for (let i = 1; i < 3; i++) {
          if (bodyChildren[i]) {
            bodyChildren[i].style.display = 'none';
            bodyChildren[i].style.opacity = '0';
            bodyChildren[i].style.visibility = 'hidden';
          }
        }
      }
    } catch (e) {
      console.log('Error removing specific children', e);
    }
    
    // 3. Override CSS to prevent any animations
    const style = document.createElement('style');
    style.innerHTML = `
      * {
        animation: none !important;
        transition: none !important;
        transform: none !important;
      }
      
      @keyframes scan { 0% { opacity: 0 !important; } 100% { opacity: 0 !important; } }
      @keyframes stars-animation { 0% { transform: none !important; } 100% { transform: none !important; } }
      @keyframes bg-pulse { 0% { transform: none !important; } 100% { transform: none !important; } }
      @keyframes aurora-pulse { 0% { transform: none !important; } 100% { transform: none !important; } }
    `;
    
    // Add the style to the document
    document.head.appendChild(style);
  }
  
  // Run immediately
  killAllAnimations();
  
  // Also run when DOM is fully loaded
  document.addEventListener('DOMContentLoaded', killAllAnimations);
  
  // Run after any React render cycles might complete
  setTimeout(killAllAnimations, 500);
  setTimeout(killAllAnimations, 1000);
  setTimeout(killAllAnimations, 2000);
  
  // Set up continuous monitoring to keep killing animations
  // Run every 500ms to catch any dynamically created elements
  setInterval(killAllAnimations, 500);
})();
