#!/bin/bash

# Explicit build script for Vercel deployment
echo "Starting custom build process..."

# Clean the build directory if it exists
echo "Cleaning build directory..."
rm -rf dist || true

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the application with detailed logging
echo "Building application..."
NODE_ENV=production VITE_SUPABASE_URL="https://slnjliheyiiummxhrgmk.supabase.co" VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsbmpsaWhleWlpdW1teGhyZ21rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4MDI2MTEsImV4cCI6MjA1MjM3ODYxMX0.0O3AhsGPFIoHQPY329lM0HA1JdFZoSodIK6uFz6DLyM" npm run build

echo "Build completed successfully"
