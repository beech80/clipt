// Single-purpose script to fix the icon colors in DiscoveryNew.tsx
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'DiscoveryNew.tsx');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Replace the icons with direct color overrides
content = content.replace(
  /<FontAwesomeIcon icon={faChevronLeft}/g, 
  '<FontAwesomeIcon icon={faChevronLeft} color="#ff8c00"'
);

content = content.replace(
  /<FontAwesomeIcon icon={faComment}/g, 
  '<FontAwesomeIcon icon={faComment} color="#ffffff"'
);

content = content.replace(
  /<FontAwesomeIcon icon={faUser}/g, 
  '<FontAwesomeIcon icon={faUser} color="#ffffff"'
);

content = content.replace(
  /<FontAwesomeIcon icon={faCut}/g, 
  '<FontAwesomeIcon icon={faCut} color="#ff8c00"'
);

content = content.replace(
  /<FontAwesomeIcon icon={faChevronRight}/g, 
  '<FontAwesomeIcon icon={faChevronRight} color="#ff8c00"'
);

content = content.replace(
  /<FontAwesomeIcon icon={faSearch}/g, 
  '<FontAwesomeIcon icon={faSearch} color="#ff8c00"'
);

content = content.replace(
  /<FontAwesomeIcon icon={faVideo}/g, 
  '<FontAwesomeIcon icon={faVideo} color="#ff8c00"'
);

// Replace dollar sign
content = content.replace(
  /<span className="[^"]*">\\$<\/span>/g,
  '<span style="color:#ff8c00;font-weight:bold;font-size:1.2rem;">$</span>'
);

// Write the changes back to the file
fs.writeFileSync(filePath, content, 'utf8');

console.log('Icon colors fixed!');
