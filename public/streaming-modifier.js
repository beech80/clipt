/**
 * Direct Streaming Component Modifier
 * This script directly manipulates the Streaming component in the DOM
 */

// Run when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Function to modify the streaming component
  function modifyStreamingComponent() {
    console.log("Attempting to modify streaming component...");
    
    // Find the streaming div by its specific attributes
    const streamingDivs = document.querySelectorAll('div[data-component-file="Streaming.tsx"], div.flex.border-b.border-slate-700');
    
    console.log("Found streaming divs:", streamingDivs.length);
    
    streamingDivs.forEach(div => {
      // Apply dramatic styling changes
      console.log("Modifying streaming div:", div);
      
      // Set styles that will be extremely noticeable
      div.style.position = 'fixed';
      div.style.top = '20px';
      div.style.left = '50%';
      div.style.transform = 'translateX(-50%)';
      div.style.zIndex = '99999';
      div.style.backgroundColor = 'purple';
      div.style.padding = '15px';
      div.style.borderRadius = '15px';
      div.style.boxShadow = '0 0 30px red';
      div.style.display = 'flex';
      div.style.flexDirection = 'column';
      div.style.textAlign = 'center';
      
      // Add a visible header
      const header = document.createElement('div');
      header.textContent = 'STREAMING MENU';
      header.style.color = 'white';
      header.style.fontWeight = 'bold';
      header.style.marginBottom = '10px';
      header.style.fontSize = '16px';
      div.prepend(header);
      
      // Style all buttons inside
      const buttons = div.querySelectorAll('button');
      buttons.forEach(button => {
        button.style.margin = '5px 0';
        button.style.backgroundColor = 'black';
        button.style.color = 'white';
        button.style.padding = '8px 16px';
        button.style.borderRadius = '5px';
        button.style.border = '1px solid white';
      });
    });
  }
  
  // Run the function immediately
  modifyStreamingComponent();
  
  // Also run it after a delay to catch any dynamically loaded components
  setTimeout(modifyStreamingComponent, 1000);
  setTimeout(modifyStreamingComponent, 2000);
});
