const fs = require('fs');
const path = require('path');

// Read the file
const filePath = path.join(__dirname, 'src', 'pages', 'DiscoveryNew.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// First fix: Line 677-678 - Replace '}' with ')'
content = content.replace(/\n              \}\n           \) : \(/g, '\n              )\n           ) : (');

// Write the corrected content back to the file
fs.writeFileSync(filePath, content);

console.log('Fixed critical JSX syntax error at line 678');
