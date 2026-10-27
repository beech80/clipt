#!/bin/sh
set -eu
tar -xzf preview-source.tgz
npm ci --ignore-scripts
node node_modules/typescript/bin/tsc --noEmit -p tsconfig.app.json
node node_modules/eslint/bin/eslint.js src/App.tsx src/pages/AutomaticPhotoCheck.tsx src/pages/DevelopmentAzureCheck.tsx src/lib/automatic-photo-storage-check.ts
VITE_BILLING_READINESS_ENABLED=true VITE_BILLING_CHECKOUT_DISABLED=true npm run build
