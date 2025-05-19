/**
 * DIRECT SPACE DROPDOWN INJECTOR
 * This must be loaded by the browser directly
 */

javascript:(function(){
  // Create styles
  const style = document.createElement('style');
  style.innerHTML = `
    #space-streaming-dropdown {
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 27, 75, 0.98));
      border: 2px solid #8b5cf6;
      border-radius: 12px;
      padding: 15px;
      z-index: 9999999;
      width: 220px;
      box-shadow: 0 0 30px #8b5cf6, 0 0 50px #f97316;
      text-align: center;
      backdrop-filter: blur(5px);
      max-height: 60px;
      overflow: hidden;
      transition: all 0.3s ease;
    }
    
    #space-streaming-dropdown:hover {
      max-height: 300px;
      padding-bottom: 20px;
    }
    
    #streaming-header {
      color: #f97316;
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 0;
      padding-bottom: 10px;
      width: 100%;
      cursor: pointer;
      text-shadow: 0 0 15px #f97316;
    }
    
    #space-streaming-dropdown:hover #streaming-header {
      margin-bottom: 15px;
      border-bottom: 2px solid #8b5cf6;
    }
    
    .stream-button {
      display: block;
      width: 90%;
      margin: 8px auto;
      padding: 12px 15px;
      background: rgba(30, 27, 75, 0.8);
      color: white;
      border: 1px solid #8b5cf6;
      border-radius: 8px;
      font-size: 15px;
      cursor: pointer;
      transition: all 0.3s ease;
      text-align: center;
    }
    
    .stream-button:hover {
      background: rgba(139, 92, 246, 0.3);
      color: #f97316;
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(139, 92, 246, 0.5);
    }
    
    /* Hide messages and original streaming components */
    div[data-component-file="Messages.tsx"],
    div[data-component-path*="Messages.tsx"],
    .text-purple-300,
    .cyber-text,
    div[data-component-file="Streaming.tsx"],
    div[data-component-name="Streaming"],
    div.flex.border-b.border-slate-700 {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
    }
  `;
  
  document.head.appendChild(style);
  
  // Create dropdown
  const dropdown = document.createElement('div');
  dropdown.id = 'space-streaming-dropdown';
  
  // Create header
  const header = document.createElement('div');
  header.id = 'streaming-header';
  header.innerHTML = '⚡ STREAMING ▼';
  dropdown.appendChild(header);
  
  // Create buttons
  const buttons = [
    { text: 'Stream Setup', icon: '🔧' },
    { text: 'Schedule', icon: '📅' },
    { text: 'Dashboard', icon: '📊' }
  ];
  
  buttons.forEach(btn => {
    const button = document.createElement('button');
    button.className = 'stream-button';
    button.innerHTML = btn.icon + ' ' + btn.text;
    
    button.addEventListener('click', function() {
      document.querySelectorAll('.stream-button').forEach(b => {
        b.style.backgroundColor = 'rgba(30, 27, 75, 0.8)';
        b.style.color = 'white';
      });
      
      this.style.backgroundColor = 'rgba(139, 92, 246, 0.3)';
      this.style.color = '#f97316';
    });
    
    dropdown.appendChild(button);
  });
  
  // Add to document
  document.body.appendChild(dropdown);
  
  // Create black overlay at top to hide any messages
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.right = '0';
  overlay.style.height = '150px';
  overlay.style.backgroundColor = '#000000';
  overlay.style.zIndex = '9999';
  overlay.style.pointerEvents = 'none';
  
  document.body.appendChild(overlay);
  
  alert('Space Streaming Dropdown Injected Successfully!');
})();
