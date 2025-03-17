import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the file
const filePath = path.join(__dirname, 'src', 'components', 'GameBoyControls.tsx');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Replace the PRESS X TO CLOSE line
content = content.replace(/<p className="text-xs text-gray-500">PRESS <span className="text-purple-400">X<\/span> TO CLOSE<\/p>/, '');

// Write the modified content back to the file
fs.writeFileSync(filePath, content, 'utf8');

console.log('Successfully removed the text!');
