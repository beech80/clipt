import { useEffect } from 'react';
import LoggingService from '@/services/loggingService';

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface ExtendedPerformance extends Performance {
  memory?: MemoryInfo;
}

interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
}

export function usePerformanceMonitoring(componentName: string) {
  useEffect(() => {
    const startTime = performance.now();
    let metrics: Partial<PerformanceMetrics> = {};

    // Track Web Vitals
    if ('PerformanceObserver' in window) {
      // Track FCP
      const fcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length > 0) {
          metrics.fcp = entries[0].startTime;
          LoggingService.trackMetric('first_contentful_paint', metrics.fcp, {
            component: componentName
          });
        }
      });
      fcpObserver.observe({ entryTypes: ['paint'] });

      // Track LCP
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        metrics.lcp = lastEntry.startTime;
        LoggingService.trackMetric('largest_contentful_paint', metrics.lcp, {
          component: componentName
        });
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // Track FID
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach(entry => {
          metrics.fid = entry.processingStart - entry.startTime;
          LoggingService.trackMetric('first_input_delay', metrics.fid, {
            component: componentName
          });
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Track CLS
      const clsObserver = new PerformanceObserver((entryList) => {
        let clsScore = 0;
        entryList.getEntries().forEach(entry => {
          if (!(entry as any).hadRecentInput) {
            clsScore += (entry as any).value;
          }
        });
        metrics.cls = clsScore;
        LoggingService.trackMetric('cumulative_layout_shift', clsScore, {
          component: componentName
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    }

    // Track memory usage if available
    const trackMemoryUsage = () => {
      const extendedPerf = performance as ExtendedPerformance;
      if (extendedPerf.memory) {
        LoggingService.trackMetric('heap_used', extendedPerf.memory.usedJSHeapSize, {
          component: componentName,
          total: extendedPerf.memory.totalJSHeapSize,
          limit: extendedPerf.memory.jsHeapSizeLimit
        });
      }
    };

    const memoryInterval = setInterval(trackMemoryUsage, 10000);

    // Track network requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - startTime;
        LoggingService.trackMetric('fetch_duration', duration, {
          component: componentName,
          url: typeof args[0] === 'string' ? args[0] : 'unknown',
          status: response.status
        });
        return response;
      } catch (error) {
        const duration = performance.now() - startTime;
        LoggingService.trackMetric('fetch_error', duration, {
          component: componentName,
          url: typeof args[0] === 'string' ? args[0] : 'unknown',
          error: error.message
        });
        throw error;
      }
    };

    return () => {
      // Clean up observers and intervals
      clearInterval(memoryInterval);
      window.fetch = originalFetch;
      
      // Track total component lifetime
      const lifetime = performance.now() - startTime;
      LoggingService.trackMetric('component_lifetime', lifetime, {
        component: componentName,
        metrics: metrics
      });
    };
  }, [componentName]);
}