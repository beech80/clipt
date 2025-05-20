import React from 'react';
import { Navigate } from 'react-router-dom';

// This is a placeholder component that redirects to the main Discovery page
// Created to fix Vercel build issues
const DiscoveryNew: React.FC = () => {
  return <Navigate to="/discovery" replace />;
};

export default DiscoveryNew;
