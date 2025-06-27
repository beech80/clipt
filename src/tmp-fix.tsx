import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SpaceLanding from './pages/SpaceLanding';
import SuspenseBoundary from '@/components/common/SuspenseBoundary';

// This is a simple backup structure to reference for fixing App.tsx
function AppRoutesStructure() {
  return (
    <>
      <Routes>
        <Route path="/" element={<SpaceLanding />} />
        <Route path="/discovery" element={<SuspenseBoundary>Discovery Component</SuspenseBoundary>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default AppRoutesStructure;
