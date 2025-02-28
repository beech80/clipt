@echo off
REM Clipt Deployment Script for Windows
REM This script builds and deploys the Clipt application

REM Set environment variables
set VITE_SUPABASE_URL=https://slnjliheyiiummxhrgmk.supabase.co
set VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsbmpsaWhleWlpdW1teGhyZ21rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4MDI2MTEsImV4cCI6MjA1MjM3ODYxMX0.0O3AhsGPFIoHQPY329lM0HA1JdFZoSodIK6uFz6DLyM

echo === Starting Clipt deployment process ===

REM Step 1: Install dependencies
echo Installing dependencies...
call npm ci
if %ERRORLEVEL% neq 0 (
  echo Failed to install dependencies
  exit /b 1
)
echo Dependencies installed successfully

REM Step 2: Build the app
echo Building application...
call npm run build
if %ERRORLEVEL% neq 0 (
  echo Build failed
  exit /b 1
)
echo Application built successfully

REM Step 3: Copy service worker to dist if needed
echo Ensuring service worker is available...
if exist public\service-worker.js (
  if not exist dist\service-worker.js (
    copy public\service-worker.js dist\
    echo Service worker copied to dist folder
  )
)

REM Step 4: Update capacitor if needed
echo Syncing with Capacitor...
call npx cap sync
if %ERRORLEVEL% neq 0 (
  echo Capacitor sync failed or not configured, continuing...
) else (
  echo Capacitor sync completed
)

echo === Deployment completed successfully ===
echo Your application is now ready in the dist/ folder
echo To preview: npm run preview

pause
