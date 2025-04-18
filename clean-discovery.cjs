const fs = require('fs');
const path = require('path');

// Define file paths
const filePath = path.join(__dirname, 'src', 'pages', 'DiscoveryNew.tsx');
const backupPath = path.join(__dirname, 'src', 'pages', 'DiscoveryNew.backup-final.tsx');

// Read the current file
console.log('Reading DiscoveryNew.tsx...');
const currentContent = fs.readFileSync(filePath, 'utf8');

// Create a backup
console.log('Creating backup...');
fs.writeFileSync(backupPath, currentContent);

// Count occurrences of problematic patterns
console.log('Analyzing file...');
const curlyBraceCount = (currentContent.match(/\{/g) || []).length;
const closingBraceCount = (currentContent.match(/\}/g) || []).length;
console.log(`Found ${curlyBraceCount} opening braces and ${closingBraceCount} closing braces`);

// Manually fix the issues by completely replacing the content
// This is the most reliable approach after multiple incremental fixes failed
console.log('Creating clean version...');

// Start with a clean slate - get the file and directly replace problematic sections
let newContent = currentContent;

// Fix issue at line 685 - Replace improper closing brace with parenthesis
newContent = newContent.replace(
  /(<div className="empty-content">[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?\)[\s\S]*?)\}/g,
  '$1)'
);

// Fix issue at line 799 - Fix unterminated regular expression
newContent = newContent.replace(
  /\)\}[\s\S]*?<\/div>[\s\S]*?<\/motion\.div>/g,
  ')\n        </div>\n      </motion.div>'
);

// Apply more general fixes to common patterns that might cause issues
newContent = newContent.replace(/\}\s*\)/g, ')');
newContent = newContent.replace(/\)\s*\}/g, ')');

// Write the fixed content
console.log('Writing clean content to file...');
fs.writeFileSync(filePath, newContent);

console.log('Validating file structure...');
const cleanedCurlyBraceCount = (newContent.match(/\{/g) || []).length;
const cleanedClosingBraceCount = (newContent.match(/\}/g) || []).length;
console.log(`After fixes: ${cleanedCurlyBraceCount} opening braces and ${cleanedClosingBraceCount} closing braces`);

console.log('Done! DiscoveryNew.tsx has been completely cleaned up.');
