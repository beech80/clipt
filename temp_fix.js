// This is a temporary fix script to correct the RetroArcadeProfile.tsx file
const fs = require('fs');
const path = require('path');

// Path to the file
const filePath = path.join(__dirname, 'src', 'components', 'profile', 'RetroArcadeProfile.tsx');

// Read the file
fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }

  // Fix missing closing div tags for comment actions
  let fixedContent = data.replace(
    `                        </button>
                  )}`,
    `                        </button>
                      </div>
                    </div>
                  )}`
  );

  // Fix missing closing div tags for post actions
  fixedContent = fixedContent.replace(
    `                    )}
            </motion.div>`,
    `                    )}
                  </div>
                </div>
              </div>
            </motion.div>`
  );

  // Write the fixed content back to the file
  fs.writeFile(filePath, fixedContent, 'utf8', (err) => {
    if (err) {
      console.error('Error writing file:', err);
      return;
    }
    console.log('Successfully fixed RetroArcadeProfile.tsx');
  });
});
