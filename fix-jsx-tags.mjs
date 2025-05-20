// ES module script to fix the JSX tag mismatch in GameBoyControls.tsx
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the file with JSX tag mismatch
const filePath = path.join(__dirname, 'src', 'components', 'GameBoyControls.tsx');

// Read the file content
try {
  const data = fs.readFileSync(filePath, 'utf8');

  // Create a backup of the original file
  const backupPath = path.join(__dirname, 'src', 'components', 'GameBoyControls.backup-fixed.tsx');
  fs.writeFileSync(backupPath, data, 'utf8');
  console.log(`✅ Created backup at ${backupPath}`);

  // Count opening and closing divs to ensure balance
  const openDivCount = (data.match(/<div/g) || []).length;
  const closeDivCount = (data.match(/<\/div>/g) || []).length;
  
  console.log(`Found ${openDivCount} opening div tags and ${closeDivCount} closing div tags`);

  // Split the content into lines to find the specific area with the mismatch
  const lines = data.split('\n');
  
  // Look specifically at the end of the component where the error occurs
  const returnStartIdx = lines.findIndex(line => line.trim().startsWith('return ('));
  
  if (returnStartIdx === -1) {
    console.log('⚠️ Could not find the return statement');
    process.exit(1);
  }
  
  console.log(`Return statement starts at line ${returnStartIdx + 1}`);
  
  // Find opening fragment
  const fragmentOpenIdx = lines.findIndex((line, i) => i >= returnStartIdx && line.trim() === '<>');
  
  if (fragmentOpenIdx === -1) {
    console.log('⚠️ Could not find the opening fragment tag');
    process.exit(1);
  }
  
  console.log(`Opening fragment at line ${fragmentOpenIdx + 1}`);
  
  // Find closing fragment and return statement end
  const fragmentCloseIdx = lines.findIndex((line, i) => i >= fragmentOpenIdx && line.trim() === '</>');
  const returnEndIdx = lines.findIndex((line, i) => i >= fragmentOpenIdx && line.trim() === ');');
  
  if (fragmentCloseIdx === -1 || returnEndIdx === -1) {
    console.log('⚠️ Could not find the closing fragment tag or return statement end');
    process.exit(1);
  }
  
  console.log(`Closing fragment at line ${fragmentCloseIdx + 1}, return ends at line ${returnEndIdx + 1}`);
  
  // Get the content between the fragment tags
  const fragmentContent = lines.slice(fragmentOpenIdx + 1, fragmentCloseIdx).join('\n');
  
  // Count div tags in the fragment
  const openDivsInFragment = (fragmentContent.match(/<div/g) || []).length;
  const closeDivsInFragment = (fragmentContent.match(/<\/div>/g) || []).length;
  
  console.log(`Fragment contains ${openDivsInFragment} opening divs and ${closeDivsInFragment} closing divs`);
  
  let fixedContent;
  
  if (openDivsInFragment !== closeDivsInFragment) {
    console.log('⚠️ Unbalanced div tags inside fragment');
    
    // Fix the specific mismatch reported at line 823
    // The error suggests there's an extra closing div before the fragment closing tag
    if (closeDivsInFragment > openDivsInFragment) {
      console.log('✅ Detected an extra closing div tag');
      
      // Get the last few lines before the closing fragment tag
      const lastLines = lines.slice(Math.max(0, fragmentCloseIdx - 5), fragmentCloseIdx);
      console.log('Last lines before closing fragment:', lastLines);
      
      // Look for a div closing tag right before the fragment closing tag
      const lastClosingDivIdx = lastLines.findIndex(line => line.trim() === '</div>');
      
      if (lastClosingDivIdx !== -1) {
        console.log('✅ Found extra div tag to remove');
        
        // Create a new version of the file with the extra div tag removed
        const linesCopy = [...lines];
        linesCopy.splice(fragmentCloseIdx - (5 - lastClosingDivIdx), 1);
        
        fixedContent = linesCopy.join('\n');
        
        // Write the fixed content back to the file
        fs.writeFileSync(filePath, fixedContent, 'utf8');
        console.log('✅ Fixed JSX tag mismatch by removing excessive closing div');
      }
    }
  } else {
    console.log('✓ The number of opening and closing div tags in the fragment is balanced');
    
    // The issue might be with how the fragment is closed
    if (lines[fragmentCloseIdx - 1].trim() === '</div>' && closeDivCount > openDivCount) {
      console.log('⚠️ Possible incorrect nesting before fragment close');
      
      // Remove the last div closing tag if it's unbalanced
      const linesCopy = [...lines];
      linesCopy.splice(fragmentCloseIdx - 1, 1);
      
      fixedContent = linesCopy.join('\n');
      
      // Write the fixed content back to the file
      fs.writeFileSync(filePath, fixedContent, 'utf8');
      console.log('✅ Fixed JSX tag mismatch by removing incorrect closing div before fragment end');
    }
  }
  
  // If we haven't fixed the content yet, let's try a direct approach based on the error message
  if (!fixedContent) {
    console.log('⚠️ Attempting direct fix based on error message');
    
    // The error suggests that there's a closing div tag that doesn't match an opening fragment tag
    // Try simply removing the div closing tag before the fragment closing tag
    const linesCopy = [...lines];
    
    // Look for the line with the issue (line 823 according to error)
    const errorLineIndex = 823 - 1; // Convert to 0-based index
    
    if (errorLineIndex < linesCopy.length && linesCopy[errorLineIndex].trim() === '</div>') {
      console.log(`✅ Removing problematic div tag at line ${errorLineIndex + 1}`);
      linesCopy.splice(errorLineIndex, 1);
      
      fixedContent = linesCopy.join('\n');
      
      // Write the fixed content back to the file
      fs.writeFileSync(filePath, fixedContent, 'utf8');
      console.log('✅ Fixed JSX tag mismatch by removing problematic closing div');
    } else {
      console.log(`⚠️ Line ${errorLineIndex + 1} does not contain a closing div tag as expected`);
      
      // Last resort: manually adjust closing tags
      // Find the closing fragment and ensure proper div nesting
      const endingPattern = [
        '</div>',
        '</div>',
        '</div>',
        '</>'
      ];
      
      const manualFixEndIndex = fragmentCloseIdx;
      const manualFixContent = endingPattern.join('\n      ');
      
      // Replace from the problematic line to the closing fragment with our fixed pattern
      const startReplace = Math.max(0, manualFixEndIndex - endingPattern.length);
      linesCopy.splice(startReplace, endingPattern.length + 1, manualFixContent);
      
      fixedContent = linesCopy.join('\n');
      
      // Write the fixed content back to the file
      fs.writeFileSync(filePath, fixedContent, 'utf8');
      console.log('✅ Fixed JSX tag mismatch using manual closing tag adjustment');
    }
  }
  
  console.log('✅ JSX tag mismatch fix complete');
} catch (err) {
  console.error('Error fixing JSX tag mismatch:', err);
}
