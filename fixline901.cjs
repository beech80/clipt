const fs = require('fs');
const path = require('path');

// Read the file
const filePath = path.join(__dirname, 'src', 'pages', 'DiscoveryNew.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// The fix for line 901: Make sure JSX is properly nested
// This looks for the problematic pattern around line 898-901 and fixes it
content = content.replace(
  /\)\}\n(\s+)<\/div>\n(\s+)<\/motion\.div>/g, 
  ')\n$1</div>\n$2</motion.div>'
);

// Write the corrected content back to the file
fs.writeFileSync(filePath, content);

console.log('Fixed unterminated regular expression error at line 901');
