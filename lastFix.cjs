const fs = require('fs');
const path = require('path');

// File paths
const filePath = path.join(__dirname, 'src', 'pages', 'DiscoveryNew.tsx');
const backupPath = path.join(__dirname, 'src', 'pages', 'DiscoveryNew.last.bak');

// Read the file
console.log('Reading DiscoveryNew.tsx...');
let content = fs.readFileSync(filePath, 'utf8');

// Create a backup
console.log('Creating backup...');
fs.writeFileSync(backupPath, content);

// Fix line 685 - Replace '}' with ')'
console.log('Fixing line 685 error...');
content = content.replace(/\n\s+\}\n\s+\{\/\* Removed Navigation arrows/g, 
                          '\n           )\n\n           {/* Removed Navigation arrows');

// Fix line 799 - Fix the unterminated regular expression
console.log('Fixing line 799 error...');
content = content.replace(/\)\}\n(\s+)<\/div>\n(\s+)<\/motion\.div>/g, 
                         ')\n$1</div>\n$2</motion.div>');

// Write the fixed content
console.log('Writing fixed content...');
fs.writeFileSync(filePath, content);

console.log('Done! Fixed both JSX syntax issues in DiscoveryNew.tsx');
