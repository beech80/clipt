import React from 'react';

// Import the Search component instead of using the NotFound component
import SearchComponent from './Search';

// Redefine NotFound to be the Search component for space-themed experience
const NotFound = () => {
  return <SearchComponent />;
};

export default NotFound;
