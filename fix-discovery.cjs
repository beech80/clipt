const fs = require('fs');
const path = require('path');

// Paths
const filePath = path.join(__dirname, 'src', 'pages', 'DiscoveryNew.tsx');
const backupPath = path.join(__dirname, 'src', 'pages', 'DiscoveryNew.backup2.tsx');

// Read the current file content
console.log('Reading DiscoveryNew.tsx...');
const content = fs.readFileSync(filePath, 'utf8');

// Create a backup
console.log('Creating backup...');
fs.writeFileSync(backupPath, content);

// Fix line 678: The character "}" is not valid inside a JSX element
console.log('Finding and replacing line 678 error...');
let fixedContent = content.replace(
  /(                \))\n(              \})\n(           \) : \()/g,
  '$1\n              )\n$3'
);

// Fix line 901: Unterminated regular expression
console.log('Finding and replacing line 901 error...');
fixedContent = fixedContent.replace(
  /(\)\})\n(         <\/div>)\n(       <\/motion\.div>)/g,
  ')\n$2\n$3'
);

// Write the fixed content back to the file
console.log('Writing fixed content...');
fs.writeFileSync(filePath, fixedContent);

console.log('Fixed two critical JSX syntax errors in DiscoveryNew.tsx');
console.log('Original file backed up to DiscoveryNew.backup2.tsx');
