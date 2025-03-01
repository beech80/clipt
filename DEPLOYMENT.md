# Clipt Deployment Guide

This document provides instructions for deploying the Clipt application in different environments.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Git
- [Supabase account](https://app.supabase.io/) for backend services

## Environment Variables

Create a `.env` file in the project root with the following variables:

```
VITE_SUPABASE_URL=https://slnjliheyiiummxhrgmk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsbmpsaWhleWlpdW1teGhyZ21rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4MDI2MTEsImV4cCI6MjA1MjM3ODYxMX0.0O3AhsGPFIoHQPY329lM0HA1JdFZoSodIK6uFz6DLyM
```

## Deployment Methods

### 1. Using the Deployment Script (Recommended)

#### Windows
Run the deployment script by double-clicking `deploy.bat` or from the command line:
```bash
deploy.bat
```

If you encounter permission issues, try running as Administrator or use this manual process:
```bash
npm install --force
npm run build
```

#### Linux/Mac
Make the script executable and run it:
```bash
chmod +x deploy.sh
./deploy.sh
```

### 2. Manual Deployment

1. Install dependencies:
```bash
npm install
```

2. Build the application:
```bash
npm run build
```

3. The built files will be in the `dist/` directory, which can be deployed to any static web hosting service.

### 3. GitHub Actions CI/CD

The project includes a GitHub Actions workflow in `.github/workflows/ci-cd.yml` that automates the build process. 

To enable automated deployments:

1. Add the following secrets to your GitHub repository:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous API key
   
2. Uncomment the deployment section in the workflow file

## PWA Installation

After deploying, users can install the app as a PWA:

1. Open the deployed website in a compatible browser (Chrome, Edge, etc.)
2. Look for the install icon in the address bar or browser menu
3. Click "Install" or "Add to Home Screen"

## Mobile App Deployment with Capacitor

### Android
```bash
npx cap sync
npx cap open android
```
Then build and deploy from Android Studio.

### iOS
```bash
npx cap sync
npx cap open ios
```
Then build and deploy from Xcode.

## Updating Supabase Types

If you need to update the Supabase types, use the provided script:

```bash
update-supabase-types.bat YOUR_SUPABASE_ACCESS_TOKEN
```

Or manually using the Supabase CLI:

```bash
supabase login YOUR_SUPABASE_ACCESS_TOKEN
supabase gen types typescript --project-id slnjliheyiiummxhrgmk > src/integrations/supabase/types.ts
```

## Troubleshooting

### Permission Issues on Windows
If you encounter "EPERM: operation not permitted" errors during deployment:

1. Close any running instances of the application or development server
2. Close code editors that might be locking files
3. Temporarily disable antivirus or add exceptions for the project folder
4. Try running the command prompt as Administrator
5. Use the `--force` flag with npm install: `npm install --force`

### Other Common Issues

- **Build Errors**: Check the error logs and make sure all dependencies are installed
- **PWA Not Working**: Verify that the service worker is registered correctly
- **Offline Mode Issues**: Test the offline page by disabling your network connection
- **Supabase Connection Problems**: Verify your Supabase credentials in the .env file
