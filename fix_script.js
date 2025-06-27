// Fix script for RetroArcadeProfile.tsx
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'profile', 'RetroArcadeProfile.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace the problematic section - removing the extra closing div tag
content = content.replace(
  `                  </div>
                </div>
              </div>`,
  `                </div>
              </div>`
);

fs.writeFileSync(filePath, content);
console.log('Fixed extra closing div tag in RetroArcadeProfile.tsx');
