import React from 'react';
import { Navigate } from 'react-router-dom';

// This is a placeholder component that redirects to the main Discovery page
// Created to fix build issues without changing core functionality
const DiscoveryFixedClean: React.FC = () => {
  return <Navigate to="/discovery" replace />;
};

export default DiscoveryFixedClean;
