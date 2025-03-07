/**
 * Feature flags to help manage dynamic imports and code splitting
 * This helps prevent issues with modules failing to load on Vercel
 */

export const FEATURES = {
  // Controls whether to use dynamic imports for specific components
  USE_CODE_SPLITTING: true,
  
  // Controls specific pages that should be bundled together rather than lazy-loaded
  BUNDLE_STREAMING_COMPONENTS: true,
  BUNDLE_PROFILE_COMPONENTS: true,
  
  // Version identifier to force cache busting on deployments
  VERSION: '1.0.1',
  
  // Environment-specific settings
  IS_PRODUCTION: import.meta.env.PROD,
  IS_DEVELOPMENT: import.meta.env.DEV,
};

export default FEATURES;
