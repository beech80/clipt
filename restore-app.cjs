
const fs = require('fs');
const path = require('path');

const appFilePath = path.join(__dirname, 'src', 'App.tsx');
const backupPath = path.join(__dirname, 'src', 'App.backup.tsx');

if (fs.existsSync(backupPath)) {
  console.log('Restoring original App.tsx...');
  fs.copyFileSync(backupPath, appFilePath);
  console.log('Original App.tsx restored successfully!');
} else {
  console.error('Backup file not found. Cannot restore the original App.');
}
