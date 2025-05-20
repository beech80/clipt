import React from 'react';
import { Navigate } from 'react-router-dom';

// Redirect to the main Discovery page - space themed design
const DiscoverySimple: React.FC = () => {
  return <Navigate to="/discovery" replace />;
};

export default DiscoverySimple;
