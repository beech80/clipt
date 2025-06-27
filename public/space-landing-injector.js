// Space landing page DOM injector
// This script directly injects the space landing page into the DOM
// bypassing any React rendering issues

(function() {
  console.log("🚀 Space landing injector running");
  
  // Create the space landing HTML
  function createSpaceLanding() {
    // Create container
    const container = document.createElement('div');
    container.id = 'standalone-space-landing';
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: #1A0544;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 999999;
      overflow: hidden;
    `;
    
    // Add stars
    const starsContainer = document.createElement('div');
    starsContainer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    `;
    
    // Create 200 stars
    for (let i = 0; i < 200; i++) {
      const star = document.createElement('div');
      const size = Math.random() * 2 + 1;
      star.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background-color: white;
        border-radius: 50%;
        top: ${Math.random() * 100}%;
        left: ${Math.random() * 100}%;
        opacity: ${Math.random() * 0.7 + 0.3};
        animation: twinkle ${Math.random() * 4 + 2}s infinite ${Math.random() * 3}s;
      `;
      starsContainer.appendChild(star);
    }
    container.appendChild(starsContainer);
    
    // Add blue planet (left side)
    const bluePlanet = document.createElement('div');
    bluePlanet.style.cssText = `
      position: absolute;
      width: 60px;
      height: 60px;
      left: 80px;
      top: 80px;
      background-color: #3B82F6;
      border-radius: 50%;
    `;
    container.appendChild(bluePlanet);
    
    // Add orange planet (right side)
    const orangePlanet = document.createElement('div');
    orangePlanet.style.cssText = `
      position: absolute;
      width: 40px;
      height: 40px;
      right: 80px;
      top: 80px;
      background-color: #F97316;
      border-radius: 50%;
    `;
    container.appendChild(orangePlanet);
    
    // Add space elements
    const spaceships = [
      {emoji: '🛸', style: 'right: 120px; bottom: 120px; transform: rotate(45deg);'},
      {emoji: '🛰️', style: 'left: 40%; bottom: 200px;'},
      {emoji: '✨', style: 'right: 30%; bottom: 40%;'}
    ];
    
    spaceships.forEach(ship => {
      const element = document.createElement('div');
      element.style.cssText = `
        position: absolute;
        font-size: 12px;
        color: white;
        ${ship.style}
      `;
      element.textContent = ship.emoji;
      container.appendChild(element);
    });
    
    // Main content container
    const content = document.createElement('div');
    content.style.cssText = `
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-top: 60px;
    `;
    
    // CLIPT logo
    const logo = document.createElement('h1');
    logo.style.cssText = `
      color: white;
      font-size: 3.75rem;
      font-weight: bold;
      letter-spacing: 0.05em;
      margin-bottom: 3rem;
      text-shadow: 0 0 10px rgba(255,255,255,0.8);
    `;
    logo.textContent = 'CLIPT';
    content.appendChild(logo);
    
    // Menu buttons grid
    const buttonsGrid = document.createElement('div');
    buttonsGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      width: 16rem;
      margin-bottom: 2rem;
    `;
    
    // Create streaming button
    const streamingBtn = document.createElement('button');
    streamingBtn.style.cssText = `
      background-color: #F97316;
      color: white;
      padding: 1rem;
      text-align: center;
      font-weight: 600;
      border-radius: 0.25rem;
      border: none;
      cursor: pointer;
    `;
    streamingBtn.innerHTML = '<span style="display: block;">STREAMING</span>';
    streamingBtn.onclick = () => window.location.href = '/streams';
    buttonsGrid.appendChild(streamingBtn);
    
    // Create posts button
    const postsBtn = document.createElement('button');
    postsBtn.style.cssText = `
      background-color: #F97316;
      color: white;
      padding: 1rem;
      text-align: center;
      font-weight: 600;
      border-radius: 0.25rem;
      border: none;
      cursor: pointer;
    `;
    postsBtn.innerHTML = '<span style="display: block;">POSTS</span>';
    postsBtn.onclick = () => window.location.href = '/posts';
    buttonsGrid.appendChild(postsBtn);
    
    content.appendChild(buttonsGrid);
    
    // Purple START GAME button
    const gameBtn = document.createElement('button');
    gameBtn.style.cssText = `
      background-color: #9333EA;
      color: white;
      font-weight: 600;
      padding: 0.75rem 1.5rem;
      border-radius: 0.25rem;
      width: 12rem;
      margin-bottom: 1.5rem;
      border: none;
      cursor: pointer;
    `;
    gameBtn.textContent = 'START GAME 🎮';
    gameBtn.onclick = () => window.location.href = '/boost';
    content.appendChild(gameBtn);
    
    // Brown SELECT MENU button
    const menuBtn = document.createElement('button');
    menuBtn.style.cssText = `
      background-color: #92400E;
      color: white;
      font-weight: 600;
      padding: 0.5rem 1rem;
      border-radius: 0.25rem;
      border: 1px solid #78350F;
      width: 10rem;
      cursor: pointer;
    `;
    menuBtn.textContent = 'SELECT MENU';
    menuBtn.onclick = () => window.location.href = '/menu';
    content.appendChild(menuBtn);
    
    container.appendChild(content);
    
    return container;
  }
  
  // Add CSS animations
  function addAnimations() {
    const style = document.createElement('style');
    style.id = 'space-landing-styles';
    style.textContent = `
      @keyframes twinkle {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 1; }
      }
      
      @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }
      
      body {
        margin: 0;
        padding: 0;
        overflow: hidden;
        background-color: #1A0544;
      }
    `;
    document.head.appendChild(style);
  }
  
  // Only show space landing when explicitly requested
  function shouldShowSpaceLanding() {
    // Disable the injector to let React handle the rendering
    return false;
  }
  
  // Inject landing page
  function injectSpaceLanding() {
    console.log("Checking if space landing should be displayed");
    
    if (shouldShowSpaceLanding()) {
      console.log("👍 Should show space landing page");
      
      // DO NOT hide React root, let it show
      const rootElement = document.getElementById('root');
      if (rootElement) {
        rootElement.style.display = 'block';
      }
      
          // Remove everything else that might be visible
      document.body.childNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE && 
            node.id !== 'standalone-space-landing' && 
            node.id !== 'space-landing-styles') {
          if (node.id === 'root') {
            // For root, hide but don't remove
            node.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important;';
          } else {
            // For other elements, try to remove them completely
            try {
              node.remove();
            } catch (e) {
              node.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important;';
            }
          }
        }
      });
      
      // Prevent React from rendering by disabling its methods
      try {
        if (window.ReactDOM && window.ReactDOM.render) {
          const originalRender = window.ReactDOM.render;
          window.ReactDOM.render = function() {
            console.log('⛔ Blocked React render attempt');
            return originalRender.apply(this, arguments);
          };
        }
      } catch (e) {
        console.log('Error modifying ReactDOM:', e);
      }
      
      // Add animations
      if (!document.getElementById('space-landing-styles')) {
        addAnimations();
      }
      
      // Check if landing page is already injected
      if (!document.getElementById('standalone-space-landing')) {
        console.log("🚀 Injecting space landing page");
        document.body.appendChild(createSpaceLanding());
        
        // Set body styles
        document.body.style.cssText = `
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
          background-color: #1A0544 !important;
          position: fixed !important;
          width: 100vw !important;
          height: 100vh !important;
        `;
      }
    } else {
      // If not on landing page, remove the container if it exists
      const landingElement = document.getElementById('standalone-space-landing');
      if (landingElement) {
        landingElement.remove();
      }
      
      // Show React root again
      const rootElement = document.getElementById('root');
      if (rootElement) {
        rootElement.style.display = '';
      }
    }
  }
  
  // Initial injection
  injectSpaceLanding();
  
  // Aggressively re-check to make sure it stays injected
  // React can't remove our space landing this way
  setInterval(injectSpaceLanding, 100); // Check more frequently
  
  // Double-check after React hydration completes
  setTimeout(() => {
    console.log('🔄 Forcing space landing display after React hydration');
    injectSpaceLanding();
    // Force it again after any possible React routing changes
    setTimeout(injectSpaceLanding, 500);
    setTimeout(injectSpaceLanding, 1000);
    setTimeout(injectSpaceLanding, 2000);
  }, 1000);
  
  // Listen for route changes (for single-page apps)
  const originalPushState = window.history.pushState;
  window.history.pushState = function() {
    originalPushState.apply(this, arguments);
    injectSpaceLanding();
  };
  
  const originalReplaceState = window.history.replaceState;
  window.history.replaceState = function() {
    originalReplaceState.apply(this, arguments);
    injectSpaceLanding();
  };
  
  window.addEventListener('popstate', injectSpaceLanding);
  
  console.log("✅ Space landing injector initialized");
})();
