const fs = require('fs');
const path = require('path');

// Read the file
const filePath = path.join(__dirname, 'src', 'pages', 'DiscoveryNew.tsx');
const tempFile = path.join(__dirname, 'src', 'pages', 'DiscoveryNew.tsx.new');

// Read the original file
let content = fs.readFileSync(filePath, 'utf8');

// Fix line 678: Replace '}' with ')'
content = content.replace(/              }\n           \) : \(/g, '              )\n           ) : (');

// Fix the other critical syntax errors
content = content.replace(/\)\}\n(\s+)<\/div>\n(\s+)<\/motion\.div>/g, ')\n$1</div>\n$2</motion.div>');

// Write to a temporary file first
fs.writeFileSync(tempFile, content);

// Now replace the original file
fs.renameSync(tempFile, filePath);

console.log('Fixed both critical JSX syntax errors in DiscoveryNew.tsx');
