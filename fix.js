const fs = require('fs');
const path = require('path');

// Read the file
const filePath = path.join(__dirname, 'src', 'pages', 'DiscoveryNew.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// First fix: Line 678 - Replace '}' with ')'
content = content.replace(
  /                \)\n              \}\n           \) : \(/g, 
  '                )\n              )\n           ) : ('
);

// Second fix: Line 787 - Replace ')' with '}'
content = content.replace(
  /             \)\n           \)/g, 
  '             )\n           }'
);

// Write the corrected content back to the file
fs.writeFileSync(filePath, content);

console.log('Fixed JSX syntax issues in DiscoveryNew.tsx');
