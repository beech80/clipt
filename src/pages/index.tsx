
import React from 'react';
import SpaceLanding from './SpaceLanding';

// This file determines what gets shown on the index route '/'
// We're using the SpaceLanding component as the main landing page

// Export SpaceLanding directly as the index page
export default function IndexPage() {
  // Simply render the SpaceLanding component
  return <SpaceLanding />;
}
