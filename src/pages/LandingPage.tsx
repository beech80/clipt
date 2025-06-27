import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * This landing page has been replaced by SpaceLanding.tsx
 * This component simply redirects to the root path where SpaceLanding is mounted
 */
const LandingPage: React.FC = () => {
  return <Navigate to="/" replace />;
};

export default LandingPage;
