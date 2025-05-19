/**
 * Custom Streaming Menu Creator
 * Enterprise-grade solution for high-traffic production environments
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log('Creating custom streaming menu...');
  
  // Create the custom streaming menu container
  const streamingMenu = document.createElement('div');
  streamingMenu.id = 'custom-streaming-menu';
  
  // Create the header with cosmic icon
  const header = document.createElement('div');
  header.id = 'custom-streaming-header';
  header.innerHTML = '<span>⚡ STREAMING ⚡</span>';
  streamingMenu.appendChild(header);
  
  // Create the buttons container for better centering
  const buttonsContainer = document.createElement('div');
  buttonsContainer.className = 'streaming-buttons-container';
  buttonsContainer.style.width = '100%';
  buttonsContainer.style.display = 'flex';
  buttonsContainer.style.flexDirection = 'column';
  buttonsContainer.style.alignItems = 'center';
  buttonsContainer.style.justifyContent = 'center';
  streamingMenu.appendChild(buttonsContainer);
  
  // Create the buttons with improved styling
  const buttonLabels = ['Stream Setup', 'Schedule', 'Dashboard'];
  const buttonIcons = ['🔧', '📅', '📊'];
  
  buttonLabels.forEach((label, index) => {
    const button = document.createElement('button');
    button.className = 'custom-streaming-button';
    
    // Create icon span for better positioning
    const iconSpan = document.createElement('span');
    iconSpan.textContent = buttonIcons[index];
    iconSpan.style.marginRight = '10px';
    iconSpan.style.fontSize = '16px';
    
    // Create text span
    const textSpan = document.createElement('span');
    textSpan.textContent = label;
    
    // Clear button and append spans
    button.innerHTML = '';
    button.appendChild(iconSpan);
    button.appendChild(textSpan);
    
    // Center contents
    button.style.display = 'flex';
    button.style.justifyContent = 'center';
    button.style.alignItems = 'center';
    
    // Add click event to buttons
    button.addEventListener('click', function() {
      console.log('Clicked:', label);
      
      // Remove active class from all buttons
      const allButtons = document.querySelectorAll('.custom-streaming-button');
      allButtons.forEach(btn => btn.classList.remove('active'));
      
      // Add active class to clicked button
      this.classList.add('active');
    });
    
    // Add to container
    buttonsContainer.appendChild(button);
    
    // Make first button active by default
    if (index === 0) {
      button.classList.add('active');
    }
  });
  
  // Add subtle cosmic particles for space theme
  function createCosmicParticles() {
    const particleContainer = document.createElement('div');
    particleContainer.style.position = 'absolute';
    particleContainer.style.top = '0';
    particleContainer.style.left = '0';
    particleContainer.style.width = '100%';
    particleContainer.style.height = '100%';
    particleContainer.style.pointerEvents = 'none';
    particleContainer.style.overflow = 'hidden';
    particleContainer.style.borderRadius = '12px';
    particleContainer.style.zIndex = '-1';
    
    // Create particles
    for (let i = 0; i < 15; i++) {
      const particle = document.createElement('div');
      const size = Math.random() * 3 + 1;
      
      Object.assign(particle.style, {
        position: 'absolute',
        width: size + 'px',
        height: size + 'px',
        backgroundColor: Math.random() > 0.5 ? '#8b5cf6' : '#f97316',
        borderRadius: '50%',
        top: Math.random() * 100 + '%',
        left: Math.random() * 100 + '%',
        opacity: Math.random() * 0.5 + 0.3
      });
      
      // Add animation
      particle.style.animation = `twinkle ${Math.random() * 3 + 2}s infinite alternate`;
      
      particleContainer.appendChild(particle);
    }
    
    return particleContainer;
  }
  
  // Add the particle container
  streamingMenu.appendChild(createCosmicParticles());
  
  // Add CSS animation for twinkling
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    @keyframes twinkle {
      0% { opacity: 0.3; transform: scale(1); }
      100% { opacity: 0.8; transform: scale(1.5); }
    }
  `;
  document.head.appendChild(styleElement);
  
  // Add the menu to the body
  document.body.appendChild(streamingMenu);
  
  // Hide the original streaming component
  function hideOriginalStreamingComponent() {
    const streamingSelectors = [
      'div[data-component-file="Streaming.tsx"]',
      'div[data-component-name="Streaming"]',
      'div.flex.border-b.border-slate-700',
      'div[data-lov-id*="Streaming.tsx"]'
    ];
    
    streamingSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        if (element.id !== 'custom-streaming-menu') {
          element.style.display = 'none';
          element.style.visibility = 'hidden';
          element.style.opacity = '0';
        }
      });
    });
  }
  
  // Hide original components
  hideOriginalStreamingComponent();
  setTimeout(hideOriginalStreamingComponent, 500);
  setTimeout(hideOriginalStreamingComponent, 1500);
  
  console.log('Custom streaming menu created successfully!');
});
