import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Function to update the GameBoyControls.tsx file with improved joystick animations
function enhanceJoystick() {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    const targetCssPath = path.join(__dirname, 'src', 'components', 'joystick-animations.css');
    const targetComponentPath = path.join(__dirname, 'src', 'components', 'GameBoyControls.tsx');
    
    // Create the CSS file with animations
    const cssContent = `/* Animations for the joystick */
@keyframes pulse-arrow {
  0% { opacity: 0.3; transform: scaleY(1); }
  50% { opacity: 0.8; transform: scaleY(1.2); }
  100% { opacity: 0.3; transform: scaleY(1); }
}

@keyframes glow-up {
  0% { box-shadow: 0 -3px 8px rgba(135, 106, 245, 0.4); }
  50% { box-shadow: 0 -6px 15px rgba(135, 106, 245, 0.7); }
  100% { box-shadow: 0 -3px 8px rgba(135, 106, 245, 0.4); }
}

@keyframes glow-down {
  0% { box-shadow: 0 3px 8px rgba(135, 106, 245, 0.4); }
  50% { box-shadow: 0 6px 15px rgba(135, 106, 245, 0.7); }
  100% { box-shadow: 0 3px 8px rgba(135, 106, 245, 0.4); }
}

/* Active indicator styles */
.joystick-up-indicator.active {
  background: rgba(135, 106, 245, 0.8) !important;
  height: 8px !important;
  animation: pulse-arrow 1.5s infinite !important;
}

.joystick-down-indicator.active {
  background: rgba(135, 106, 245, 0.8) !important;
  height: 8px !important;
  animation: pulse-arrow 1.5s infinite !important;
}

.joystick-handle-up {
  animation: glow-up 1.5s infinite ease-in-out !important;
  border-bottom: 2px solid rgba(135, 106, 245, 0.7) !important;
}

.joystick-handle-down {
  animation: glow-down 1.5s infinite ease-in-out !important;
  border-top: 2px solid rgba(135, 106, 245, 0.7) !important;
}
`;
    
    // Write CSS file
    fs.writeFileSync(targetCssPath, cssContent);
    console.log(`✅ Created animation CSS file at: ${targetCssPath}`);
    
    // Read the existing GameBoyControls.tsx
    let gameBoyContent = fs.readFileSync(targetComponentPath, 'utf8');
    
    // Check if the CSS is already imported
    if (!gameBoyContent.includes('import \'./joystick-animations.css\'')) {
      // Add the CSS import
      gameBoyContent = gameBoyContent.replace(
        'import { useQueryClient } from \'@tanstack/react-query\';',
        'import { useQueryClient } from \'@tanstack/react-query\';\nimport \'./joystick-animations.css\'; // Import joystick animations'
      );
      
      console.log('✅ Added CSS import to GameBoyControls.tsx');
    }
    
    // Add updateDirectionIndicators function
    if (!gameBoyContent.includes('updateDirectionIndicators')) {
      const functionToAdd = `
  // Function to update direction indicators for better visual feedback
  const updateDirectionIndicators = (yPosition) => {
    const joystickHandle = joystickRef.current;
    const upIndicator = document.querySelector('.joystick-up-indicator');
    const downIndicator = document.querySelector('.joystick-down-indicator');
    
    if (joystickHandle && upIndicator && downIndicator) {
      if (yPosition < -5) {
        // Moving up
        upIndicator.classList.add('active');
        downIndicator.classList.remove('active');
        joystickHandle.classList.add('joystick-handle-up');
        joystickHandle.classList.remove('joystick-handle-down');
      } else if (yPosition > 5) {
        // Moving down
        downIndicator.classList.add('active');
        upIndicator.classList.remove('active');
        joystickHandle.classList.add('joystick-handle-down');
        joystickHandle.classList.remove('joystick-handle-up');
      } else {
        // Neutral
        upIndicator.classList.remove('active');
        downIndicator.classList.remove('active');
        joystickHandle.classList.remove('joystick-handle-up', 'joystick-handle-down');
      }
    }
  };`;
      
      // Find a good place to insert the function
      const handleJoystickMouseUpIndex = gameBoyContent.indexOf('const handleJoystickMouseUp = () => {');
      
      if (handleJoystickMouseUpIndex !== -1) {
        let insertionPoint = gameBoyContent.lastIndexOf(';', handleJoystickMouseUpIndex) + 1;
        
        if (insertionPoint !== 0) {
          // Insert the function at the found position
          gameBoyContent = 
            gameBoyContent.substring(0, insertionPoint) + 
            functionToAdd + 
            gameBoyContent.substring(insertionPoint);
          
          console.log('✅ Added updateDirectionIndicators function');
        }
      }
    }
    
    // Add updateDirectionIndicators call to mouse and touch handlers
    if (!gameBoyContent.includes('updateDirectionIndicators(dy)')) {
      // Update handleJoystickMouseMove
      gameBoyContent = gameBoyContent.replace(
        'handleScrollFromJoystick(dy);',
        'handleScrollFromJoystick(dy);\n    updateDirectionIndicators(dy);'
      );
      
      // Update handleJoystickTouchMove
      gameBoyContent = gameBoyContent.replace(
        'handleScrollFromJoystick(dy);',
        'handleScrollFromJoystick(dy);\n    updateDirectionIndicators(dy);'
      );
      
      // Update reset in handleJoystickMouseUp
      gameBoyContent = gameBoyContent.replace(
        'setJoystickPosition({ x: 0, y: 0 });',
        `setJoystickPosition({ x: 0, y: 0 });
    
    // Reset indicators
    if (joystickRef.current) {
      joystickRef.current.classList.remove('joystick-handle-up', 'joystick-handle-down');
    }
    
    const upIndicator = document.querySelector('.joystick-up-indicator');
    const downIndicator = document.querySelector('.joystick-down-indicator');
    
    if (upIndicator) upIndicator.classList.remove('active');
    if (downIndicator) downIndicator.classList.remove('active');`
      );
      
      console.log('✅ Added updateDirectionIndicators calls to event handlers');
    }
    
    // Update the joystick JSX to include the direction indicators
    const joystickJsx = `
              {/* Left - Interactive Joystick */}
              <div 
                ref={baseRef}
                className="w-14 h-14 bg-[#1D1D26] rounded-full flex items-center justify-center cursor-move relative overflow-visible"
                onMouseDown={handleJoystickMouseDown}
                onTouchStart={handleJoystickTouchStart}
              >
                {/* Up indicator arrow */}
                <div 
                  className="joystick-up-indicator absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-4 rounded-t-full pointer-events-none"
                  style={{
                    background: 'rgba(135, 106, 245, 0.3)',
                    transition: 'background 0.2s ease, height 0.2s ease',
                    zIndex: 10
                  }}
                />
                
                {/* Down indicator arrow */}
                <div 
                  className="joystick-down-indicator absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-2 h-4 rounded-b-full pointer-events-none"
                  style={{
                    background: 'rgba(135, 106, 245, 0.3)',
                    transition: 'background 0.2s ease, height 0.2s ease',
                    zIndex: 10
                  }}
                />
                
                {/* Create a joystick appearance */}
                <div 
                  ref={joystickRef}
                  className="w-8 h-8 bg-[#333340] rounded-full absolute transition-all duration-75 ease-out"
                  style={{ 
                    transform: \`translate(\${joystickPosition.x}px, \${joystickPosition.y}px)\`,
                    boxShadow: isDragging ? '0 0 8px rgba(135, 106, 245, 0.4)' : 'none'
                  }}
                />
                
                {/* Add subtle indicator that this is interactive */}
                <div 
                  className="absolute inset-0 rounded-full bg-opacity-10 bg-white animate-pulse pointer-events-none" 
                  style={{ 
                    animation: 'pulse 2s infinite ease-in-out', 
                    opacity: isDragging ? 0 : 0.1 
                  }} 
                />
              </div>`;
    
    // Find and replace the joystick JSX
    const originalJoystickRegex = /{\/\* Left - Interactive Joystick \*\/}[\s\S]*?<\/div>\s*?<\/div>/;
    
    if (originalJoystickRegex.test(gameBoyContent)) {
      gameBoyContent = gameBoyContent.replace(originalJoystickRegex, joystickJsx);
      console.log('✅ Updated joystick JSX with animation indicators');
    }
    
    // Write the updated file
    fs.writeFileSync(targetComponentPath, gameBoyContent);
    
    console.log('✅ Successfully updated GameBoyControls.tsx with enhanced joystick animations!');
    console.log('🎮 The joystick now has improved up/down animations with visual feedback.');
    
    return true;
  } catch (error) {
    console.error('❌ Error updating joystick:', error);
    return false;
  }
}

// Run the enhancement
enhanceJoystick();
