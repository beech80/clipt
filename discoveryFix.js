const fs = require('fs');

// Read the file content
const file = 'src/pages/DiscoveryNew.tsx';
let content = fs.readFileSync(file, 'utf8');

// First fix: Line 678 - Replace the closing curly brace with a closing parenthesis
content = content.replace(/(                )\)\n(              )\}\n(           \) : \()/g, '$1)\n$2)\n$3');

// Second fix: Line 787 - Replace the closing parenthesis with a closing curly brace
content = content.replace(/(             \)\n)(           \))/g, '$1           }');

// Write the fixed content back to the file
fs.writeFileSync(file, content);

console.log('Fixed JSX syntax issues in ' + file);
