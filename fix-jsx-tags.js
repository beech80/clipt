// Simple script to fix the JSX tag mismatch in GameBoyControls.tsx
const fs = require('fs');
const path = require('path');

// Path to the file with JSX tag mismatch
const filePath = path.join(__dirname, 'src', 'components', 'GameBoyControls.tsx');

// Read the file content
fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }

  // Create a backup of the original file
  const backupPath = path.join(__dirname, 'src', 'components', 'GameBoyControls.backup.tsx');
  fs.writeFileSync(backupPath, data, 'utf8');
  console.log(`✅ Created backup at ${backupPath}`);

  // Check to make sure we're fixing the right issue
  if (data.includes('</div>\n    </>\n  );')) {
    console.log('✅ Found JSX tag mismatch pattern');
    
    // Count opening and closing divs to ensure balance
    const openDivCount = (data.match(/<div/g) || []).length;
    const closeDivCount = (data.match(/<\/div>/g) || []).length;
    
    console.log(`Found ${openDivCount} opening div tags and ${closeDivCount} closing div tags`);
    
    if (openDivCount > closeDivCount) {
      console.log('⚠️ There are more opening div tags than closing div tags');
    } else if (openDivCount < closeDivCount) {
      console.log('⚠️ There are more closing div tags than opening div tags');
      
      // Fix: Remove one excessive closing div tag before the fragment closing tag
      const fixedContent = data.replace('</div>\n    </>', '</>');
      
      // Write the fixed content back to the file
      fs.writeFileSync(filePath, fixedContent, 'utf8');
      console.log('✅ Fixed JSX tag mismatch by removing excessive closing div');
    } else {
      console.log('✓ The number of opening and closing div tags is balanced');
      
      // The issue might be with nested fragments or other tags
      // Let's ensure proper nesting around the return statement
      const returnPattern = /return\s*\(\s*<>([\s\S]*?)<\/>\s*\);/;
      const match = data.match(returnPattern);
      
      if (match) {
        console.log('✅ Found return statement with fragment');
        
        // Check if there's proper div nesting inside the fragment
        const fragmentContent = match[1];
        const openDivsInFragment = (fragmentContent.match(/<div/g) || []).length;
        const closeDivsInFragment = (fragmentContent.match(/<\/div>/g) || []).length;
        
        console.log(`Fragment contains ${openDivsInFragment} opening divs and ${closeDivsInFragment} closing divs`);
        
        if (openDivsInFragment !== closeDivsInFragment) {
          console.log('⚠️ Unbalanced div tags inside fragment');
          
          // Simple fix: ensure proper div nesting by correcting the closing tags
          let fixedContent;
          
          if (openDivsInFragment > closeDivsInFragment) {
            // Add missing closing divs
            const missingDivs = openDivsInFragment - closeDivsInFragment;
            let closingDivs = '';
            for (let i = 0; i < missingDivs; i++) {
              closingDivs += '</div>\n    ';
            }
            fixedContent = data.replace('</>\n  );', `${closingDivs}</>\n  );`);
          } else {
            // Remove excess closing divs
            let tempContent = data;
            for (let i = 0; i < closeDivsInFragment - openDivsInFragment; i++) {
              tempContent = tempContent.replace('</div>\n    </>', '</>');
            }
            fixedContent = tempContent;
          }
          
          // Write the fixed content back to the file
          fs.writeFileSync(filePath, fixedContent, 'utf8');
          console.log('✅ Fixed JSX tag mismatch by balancing div tags');
        }
      }
    }
  } else {
    // The specific pattern wasn't found, attempting more general fix
    console.log('⚠️ Specific JSX tag mismatch pattern not found');
    
    // Look for the general area where the error was reported (line 823)
    const lines = data.split('\n');
    const errorLineIndex = 823 - 1; // 0-based index
    
    if (errorLineIndex < lines.length) {
      const errorContext = lines.slice(Math.max(0, errorLineIndex - 5), Math.min(lines.length, errorLineIndex + 5)).join('\n');
      console.log('Error context:\n', errorContext);
      
      // Try to find and fix the issue based on error message
      // Handle mismatched fragment
      if (errorContext.includes('</div>\n      </>')) {
        let updatedLines = [...lines];
        
        // Check balance for the last few divs before fragment close
        const balanceContext = lines.slice(Math.max(0, errorLineIndex - 20), errorLineIndex + 1);
        const openDivsLocal = (balanceContext.join('\n').match(/<div/g) || []).length;
        const closeDivsLocal = (balanceContext.join('\n').match(/<\/div>/g) || []).length;
        
        console.log(`Local context: ${openDivsLocal} opening divs, ${closeDivsLocal} closing divs`);
        
        if (closeDivsLocal > openDivsLocal) {
          // Fix: Remove the extra closing div
          updatedLines[errorLineIndex] = '      </>';
          
          const fixedContent = updatedLines.join('\n');
          fs.writeFileSync(filePath, fixedContent, 'utf8');
          console.log('✅ Fixed JSX tag mismatch by removing a closing div tag at line 823');
        }
      }
    }
  }
});
