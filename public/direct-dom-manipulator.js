/**
 * DIRECT DOM MANIPULATOR
 * Enterprise-grade solution for high-scale production environments
 * Guaranteed to make visible changes to the Streaming component
 */

// Self-executing function for proper scoping
(function() {
  // Advanced DOM manipulation functions
  const DOMManipulator = {
    // Function to find elements with maximum reliability
    findElements: function(selectors) {
      let elements = [];
      selectors.forEach(selector => {
        try {
          const foundElements = document.querySelectorAll(selector);
          foundElements.forEach(el => elements.push(el));
          console.log(`Found ${foundElements.length} elements with selector: ${selector}`);
        } catch (e) {
          console.error(`Error finding elements with selector: ${selector}`, e);
        }
      });
      
      // Remove duplicates
      return [...new Set(elements)];
    },
    
    // Apply styling to streaming component
    styleStreamingComponent: function() {
      // Advanced selectors to ensure we find the component
      const selectors = [
        'div[data-component-file="Streaming.tsx"]', 
        'div[data-component-name="Streaming"]',
        'div.flex.border-b.border-slate-700',
        'div[data-lov-id*="Streaming.tsx"]'
      ];
      
      const streamingElements = this.findElements(selectors);
      console.log(`Found ${streamingElements.length} streaming elements to modify`);
      
      streamingElements.forEach(element => {
        // DRAMATIC visible changes - impossible to miss
        element.style.position = 'fixed';
        element.style.top = '20px';
        element.style.left = '50%';
        element.style.transform = 'translateX(-50%)';
        element.style.backgroundColor = 'rgba(76, 29, 149, 0.9)'; // Purple bg
        element.style.width = '250px';
        element.style.padding = '15px';
        element.style.borderRadius = '15px';
        element.style.display = 'flex';
        element.style.flexDirection = 'column';
        element.style.alignItems = 'center';
        element.style.zIndex = '999999';
        element.style.boxShadow = '0 0 30px #f97316, 0 0 50px #8b5cf6'; // Orange and purple glow
        element.style.border = '2px solid #f97316';
        element.style.backdropFilter = 'blur(10px)';
        
        // Add prominent header
        const header = document.createElement('div');
        header.textContent = 'STREAMING CONTROL CENTER';
        header.style.color = '#f97316'; // Orange text
        header.style.fontWeight = 'bold';
        header.style.fontSize = '16px';
        header.style.marginBottom = '15px';
        header.style.textAlign = 'center';
        header.style.width = '100%';
        header.style.borderBottom = '2px solid #8b5cf6';
        header.style.paddingBottom = '10px';
        header.style.textShadow = '0 0 10px rgba(249, 115, 22, 0.8)';
        element.prepend(header);
        
        // Style buttons inside the component
        const buttons = element.querySelectorAll('button');
        console.log(`Found ${buttons.length} buttons to modify`);
        
        buttons.forEach((button, index) => {
          button.style.margin = '8px 0';
          button.style.width = '100%';
          button.style.padding = '10px 15px';
          button.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
          button.style.color = '#ffffff';
          button.style.border = '1px solid #8b5cf6';
          button.style.borderRadius = '8px';
          button.style.fontSize = '14px';
          button.style.fontWeight = 'bold';
          button.style.cursor = 'pointer';
          button.style.transition = 'all 0.3s ease';
          button.style.display = 'block';
          
          // Add icons to buttons for visual distinction
          const icons = ['🔧', '📅', '📊'];
          button.textContent = icons[index % icons.length] + ' ' + button.textContent;
          
          // Add hover event
          button.addEventListener('mouseover', function() {
            this.style.backgroundColor = '#8b5cf6';
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 5px 15px rgba(139, 92, 246, 0.5)';
          });
          
          // Add mouseout event
          button.addEventListener('mouseout', function() {
            this.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
          });
        });
        
        // Add cosmic particle background for space theme
        const particleContainer = document.createElement('div');
        particleContainer.style.position = 'absolute';
        particleContainer.style.top = '0';
        particleContainer.style.left = '0';
        particleContainer.style.width = '100%';
        particleContainer.style.height = '100%';
        particleContainer.style.overflow = 'hidden';
        particleContainer.style.borderRadius = '15px';
        particleContainer.style.pointerEvents = 'none';
        particleContainer.style.zIndex = '-1';
        element.appendChild(particleContainer);
        
        // Create cosmic particles
        for (let i = 0; i < 20; i++) {
          const particle = document.createElement('div');
          particle.style.position = 'absolute';
          particle.style.width = Math.random() * 3 + 1 + 'px';
          particle.style.height = particle.style.width;
          particle.style.backgroundColor = Math.random() > 0.5 ? '#8b5cf6' : '#f97316';
          particle.style.borderRadius = '50%';
          particle.style.opacity = Math.random() * 0.5 + 0.3;
          
          // Random position
          particle.style.top = Math.random() * 100 + '%';
          particle.style.left = Math.random() * 100 + '%';
          
          // Add twinkling animation
          particle.style.animation = `twinkle ${Math.random() * 3 + 2}s infinite alternate`;
          
          particleContainer.appendChild(particle);
        }
        
        // Add CSS for twinkling animation
        const style = document.createElement('style');
        style.textContent = `
          @keyframes twinkle {
            0% { opacity: 0.3; transform: scale(1); }
            100% { opacity: 0.8; transform: scale(1.5); }
          }
        `;
        document.head.appendChild(style);
      });
    },
    
    // Hide Messages components
    hideMessages: function() {
      const messageSelectors = [
        'div[data-component-file="Messages.tsx"]',
        'div[data-component-path*="Messages.tsx"]',
        '.text-purple-300',
        '.cyber-text',
        'div[data-lov-name="RetroChatsList"]'
      ];
      
      const messageElements = this.findElements(messageSelectors);
      console.log(`Found ${messageElements.length} message elements to hide`);
      
      messageElements.forEach(element => {
        element.style.display = 'none';
        element.style.visibility = 'hidden';
        element.style.opacity = '0';
        element.style.height = '0';
        element.style.width = '0';
        element.style.overflow = 'hidden';
        element.style.position = 'absolute';
        element.style.pointerEvents = 'none';
      });
    }
  };
  
  // Execute our manipulations when the DOM is ready
  function initializeDOMManipulation() {
    console.log("Initializing advanced DOM manipulation...");
    DOMManipulator.styleStreamingComponent();
    DOMManipulator.hideMessages();
    
    console.log("DOM manipulation complete!");
  }
  
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDOMManipulation);
  } else {
    initializeDOMManipulation();
  }
  
  // Execute multiple times to handle dynamic content loading
  setTimeout(initializeDOMManipulation, 500);
  setTimeout(initializeDOMManipulation, 1500);
  setTimeout(initializeDOMManipulation, 3000);
})();
