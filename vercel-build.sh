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
NODE_ENV=production npm run build

echo "Build completed successfully"
