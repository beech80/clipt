const fs = require('fs');
const path = require('path');

// Create a minimal working App component that will load correctly
const minimalApp = `
import React from 'react';
import { useLocation, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import './index.css';

// Minimal components 
const LoadingFallback = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh',
    background: '#121212',
    color: '#FF5500'
  }}>
    <div>
      <h2>Loading CLIPT...</h2>
      <div style={{ 
        width: '50px', 
        height: '50px', 
        border: '3px solid #FF5500', 
        borderTopColor: 'transparent',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '20px auto'
      }}></div>
    </div>
    <style>
      {
        \`@keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }\`
      }
    </style>
  </div>
);

const Home = () => (
  <div style={{ 
    display: 'flex', 
    flexDirection: 'column',
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh',
    background: '#121212',
    color: 'white',
    textAlign: 'center',
    padding: '0 20px'
  }}>
    <h1 style={{ color: '#FF5500', marginBottom: '20px' }}>Welcome to CLIPT</h1>
    <p>A working minimal version of the app.</p>
    <div style={{
      padding: '20px',
      background: '#2A1A12',
      borderRadius: '8px',
      maxWidth: '400px',
      margin: '20px 0',
      border: '1px solid rgba(255, 85, 0, 0.3)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
    }}>
      <p>
        The full app will be available soon. We're currently fixing deployment issues.
      </p>
    </div>
  </div>
);

function App() {
  const location = useLocation();
  
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Toaster position="top-center" richColors />
    </>
  );
}

export default App;
`;

// Path to App file
const appFilePath = path.join(__dirname, 'src', 'App.tsx');
const backupPath = path.join(__dirname, 'src', 'App.backup.tsx');

// Create backup of existing App
if (fs.existsSync(appFilePath)) {
  console.log('Creating backup of original App.tsx...');
  fs.copyFileSync(appFilePath, backupPath);
}

// Write minimal App
console.log('Writing minimal App.tsx...');
fs.writeFileSync(appFilePath, minimalApp);
console.log('Minimal App.tsx created successfully!');
console.log('You can now try building and deploying the app again.');
console.log('To restore the original App, run: node restore-app.cjs');

// Create a restore script
const restoreScript = `
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
`;

const restoreScriptPath = path.join(__dirname, 'restore-app.cjs');
fs.writeFileSync(restoreScriptPath, restoreScript);
console.log('Restore script created at', restoreScriptPath);
