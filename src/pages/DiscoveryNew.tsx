import React from 'react';
import { Navigate } from 'react-router-dom';

// This is a placeholder component that redirects to the main Discovery page
// Created to keep your app's enhanced streaming interface working properly
const DiscoveryNew: React.FC = () => {
  return <Navigate to="/discovery" replace />;
};

export default DiscoveryNew;
