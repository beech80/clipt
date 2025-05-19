/**
 * IMMEDIATE EXEC SCRIPT: Direct Space-Themed Streaming Menu Creator
 * Production-ready solution for enterprise-scale environments
 */

// Self-executing function that runs immediately
(function() {
  console.log("DIRECT-FIX: Starting immediate dropdown creation");
  
  // Function to create the dropdown
  function createStreamingDropdown() {
    console.log("DIRECT-FIX: Creating dropdown menu");
    
    // Create dropdown container
    const dropdown = document.createElement('div');
    dropdown.id = 'space-streaming-dropdown';
    
    // Set styles directly on element
    Object.assign(dropdown.style, {
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: '9999999',
      backgroundColor: 'rgba(30, 27, 75, 0.95)',
      backgroundImage: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 27, 75, 0.98))',
      borderRadius: '12px',
      border: '2px solid #8b5cf6',
      padding: '15px',
      width: '220px',
      boxShadow: '0 0 30px #8b5cf6, 0 0 50px #f97316',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      backdropFilter: 'blur(5px)',
      maxHeight: '60px',
      overflow: 'hidden',
      transition: 'all 0.3s ease'
    });
    
    // Create header
    const header = document.createElement('div');
    header.innerHTML = '⚡ STREAMING ▼';
    
    // Style header
    Object.assign(header.style, {
      color: '#f97316',
      fontSize: '18px',
      fontWeight: 'bold',
      marginBottom: '0',
      paddingBottom: '10px',
      width: '100%',
      cursor: 'pointer',
      textShadow: '0 0 15px #f97316'
    });
    
    // Add hover effect
    dropdown.addEventListener('mouseenter', function() {
      this.style.maxHeight = '300px';
      this.style.paddingBottom = '20px';
      header.style.marginBottom = '15px';
      header.style.borderBottom = '2px solid #8b5cf6';
    });
    
    dropdown.addEventListener('mouseleave', function() {
      this.style.maxHeight = '60px';
      this.style.paddingBottom = '15px';
      header.style.marginBottom = '0';
      header.style.borderBottom = 'none';
    });
    
    // Add header to dropdown
    dropdown.appendChild(header);
    
    // Create buttons
    const buttons = [
      { text: 'Stream Setup', icon: '🔧' },
      { text: 'Schedule', icon: '📅' },
      { text: 'Dashboard', icon: '📊' }
    ];
    
    buttons.forEach(btn => {
      const button = document.createElement('button');
      button.innerHTML = btn.icon + ' ' + btn.text;
      
      // Style button
      Object.assign(button.style, {
        display: 'block',
        width: '90%',
        margin: '8px auto',
        padding: '12px 15px',
        backgroundColor: 'rgba(30, 27, 75, 0.8)',
        color: 'white',
        border: '1px solid #8b5cf6',
        borderRadius: '8px',
        fontSize: '15px',
        fontWeight: 'bold',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        textAlign: 'center'
      });
      
      // Add hover effect
      button.addEventListener('mouseenter', function() {
        this.style.backgroundColor = 'rgba(139, 92, 246, 0.3)';
        this.style.color = '#f97316';
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 5px 15px rgba(139, 92, 246, 0.5)';
      });
      
      button.addEventListener('mouseleave', function() {
        this.style.backgroundColor = 'rgba(30, 27, 75, 0.8)';
        this.style.color = 'white';
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = 'none';
      });
      
      // Add click event
      button.addEventListener('click', function() {
        console.log('Clicked:', btn.text);
        
        // Reset all buttons
        dropdown.querySelectorAll('button').forEach(b => {
          b.style.backgroundColor = 'rgba(30, 27, 75, 0.8)';
          b.style.color = 'white';
        });
        
        // Highlight clicked button
        this.style.backgroundColor = 'rgba(139, 92, 246, 0.3)';
        this.style.color = '#f97316';
      });
      
      dropdown.appendChild(button);
    });
    
    // Hide original streaming component
    const originalStreamingSelectors = [
      'div[data-component-file="Streaming.tsx"]',
      'div[data-component-name="Streaming"]',
      'div.flex.border-b.border-slate-700'
    ];
    
    originalStreamingSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        el.style.display = 'none';
        el.style.visibility = 'hidden';
        el.style.opacity = '0';
      });
    });
    
    // Hide messages components
    const messageSelectors = [
      'div[data-component-file="Messages.tsx"]',
      'div[data-component-path*="Messages.tsx"]',
      '.text-purple-300',
      '.cyber-text',
      'div[data-lov-name="RetroChatsList"]',
      '.sc-jZTQcj',
      '.hFlFDr'
    ];
    
    messageSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        el.style.display = 'none';
        el.style.visibility = 'hidden';
        el.style.opacity = '0';
      });
    });
    
    // Add to body
    document.body.appendChild(dropdown);
    console.log("DIRECT-FIX: Dropdown added to body");
  }
  
  // Function to ensure our dropdown is created
  function ensureDropdown() {
    // Try to create immediately
    if (document.body) {
      createStreamingDropdown();
    }
    
    // Also wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', createStreamingDropdown);
    }
    
    // Also try multiple times with intervals
    setTimeout(createStreamingDropdown, 500);
    setTimeout(createStreamingDropdown, 1500);
    setTimeout(createStreamingDropdown, 3000);
  }
  
  // Run immediately
  ensureDropdown();
})();
