// Simple performance monitoring hook

import { useEffect } from 'react';

export const usePerformanceMonitoring = (componentName: string) => {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Performance] ${componentName} rendered in ${duration.toFixed(2)}ms`);
      }
    };
  }, [componentName]);
};
