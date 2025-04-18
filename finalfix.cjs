const fs = require('fs');
const path = require('path');

// Read the file
const filePath = path.join(__dirname, 'src', 'pages', 'DiscoveryNew.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace line 677 '}' with ')'
content = content.replace(/(\n\s+)\}\n(\s+\) : \()/g, '$1)\n$2');

// Write the corrected content back to the file
fs.writeFileSync(filePath, content);

console.log('Fixed JSX syntax error at line 677');
