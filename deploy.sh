#!/bin/bash

# Clipt Deployment Script
# This script builds and deploys the Clipt application

# Set environment variables 
export VITE_SUPABASE_URL="https://slnjliheyiiummxhrgmk.supabase.co"
export VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsbmpsaWhleWlpdW1teGhyZ21rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4MDI2MTEsImV4cCI6MjA1MjM3ODYxMX0.0O3AhsGPFIoHQPY329lM0HA1JdFZoSodIK6uFz6DLyM"

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Starting Clipt deployment process ===${NC}"

# Step 1: Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm ci
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to install dependencies${NC}"
  exit 1
fi
echo -e "${GREEN}Dependencies installed successfully${NC}"

# Step 2: Build the app
echo -e "${YELLOW}Building application...${NC}"
npm run build
if [ $? -ne 0 ]; then
  echo -e "${RED}Build failed${NC}"
  exit 1
fi
echo -e "${GREEN}Application built successfully${NC}"

# Step 3: Copy service worker to dist if needed
echo -e "${YELLOW}Ensuring service worker is available...${NC}"
if [ -f "public/service-worker.js" ] && [ ! -f "dist/service-worker.js" ]; then
  cp public/service-worker.js dist/
  echo -e "${GREEN}Service worker copied to dist folder${NC}"
fi

# Step 4: Update capacitor if needed
echo -e "${YELLOW}Syncing with Capacitor...${NC}"
npx cap sync
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}Capacitor sync failed or not configured, continuing...${NC}"
else
  echo -e "${GREEN}Capacitor sync completed${NC}"
fi

echo -e "${GREEN}=== Deployment completed successfully ===${NC}"
echo -e "${YELLOW}Your application is now ready in the dist/ folder${NC}"
echo -e "To preview: ${YELLOW}npm run preview${NC}"
