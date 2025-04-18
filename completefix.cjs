const fs = require('fs');
const path = require('path');

// File paths
const filePath = path.join(__dirname, 'src', 'pages', 'DiscoveryNew.tsx');
const backupPath = path.join(__dirname, 'src', 'pages', 'DiscoveryNew.complete.bak');

// Read the file
console.log('Reading DiscoveryNew.tsx...');
let content = fs.readFileSync(filePath, 'utf8');

// Create a backup
console.log('Creating backup...');
fs.writeFileSync(backupPath, content);

// Extract the problematic sections for line 678
console.log('Extracting problem sections...');
const section1Start = content.indexOf('<div className="empty-content">');
const section1End = content.indexOf('           ) : (', section1Start);

if (section1Start !== -1 && section1End !== -1) {
  console.log('Found problem section 1. Fixing...');
  const beforeSection = content.substring(0, section1Start);
  const afterSection = content.substring(section1End);
  
  // Create fixed section with proper JSX syntax
  const fixedSection = `<div className="empty-content">
                    <div className="empty-message">
                      <p>No content found for {selectedGame?.name}</p>
                    </div>
                  </div>
                )
              )`;
              
  // Replace the problematic section
  content = beforeSection + fixedSection + afterSection;
  console.log('Section 1 fixed.');
} else {
  console.log('Could not find problem section 1!');
}

// Extract the problematic sections for line 901
const section2Start = content.indexOf('</button>\\n      </div>\\n    </div>\\n  </motion.div>\\n)}');
const section2End = content.indexOf('        </div>\\n      </motion.div>', section2Start > 0 ? section2Start : 0);

if (section2Start !== -1 && section2End !== -1) {
  console.log('Found problem section 2. Fixing...');
  const beforeSection = content.substring(0, section2Start);
  const afterSection = content.substring(section2End + '        </div>\\n      </motion.div>'.length);
  
  // Create fixed section with proper JSX syntax
  const fixedSection = `</button>
      </div>
    </div>
  </motion.div>
)}
        </div>
      </motion.div>`;
              
  // Replace the problematic section
  content = beforeSection + fixedSection + afterSection;
  console.log('Section 2 fixed.');
} else {
  console.log('Could not find problem section 2!');
}

// Direct replacements for common issues
content = content.replace(/\}\n\s+\) : \(/g, ')\n           ) : (');
content = content.replace(/\)\}\n\s+<\/div>\n\s+<\/motion\.div>/g, ')\n        </div>\n      </motion.div>');

// Write the fixed content
console.log('Writing fixed content...');
fs.writeFileSync(filePath, content);

console.log('Done! Fixed JSX syntax issues in DiscoveryNew.tsx');
