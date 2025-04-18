// This script will perform a complete rewrite of the UserProfile component to fix syntax issues
const fs = require('fs');
const path = require('path');

const userProfilePath = path.join(__dirname, 'src', 'pages', 'UserProfile.tsx');

// Completely rewrite the file with proper structure
try {
  const content = fs.readFileSync(userProfilePath, 'utf8');
  
  // Split the file at the last div closure
  const parts = content.split(/{renderTabContent\(\)}\n\s+<\/div>/);
  
  if (parts.length < 2) {
    console.error('Could not find the expected pattern in the file');
    process.exit(1);
  }
  
  // Create the new content with proper React component closure
  const newContent = `${parts[0]}{renderTabContent()}
    </div>
  </>
);

export default UserProfile;
`;

  // Write the new content back to the file
  fs.writeFileSync(userProfilePath, newContent, 'utf8');
  console.log('Fixed UserProfile.tsx successfully!');
} catch (error) {
  console.error('Error:', error);
}
