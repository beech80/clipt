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

interface ExtendedPerformanceEntry extends PerformanceEntry {
  processingStart?: number;
  value?: number;
  hadRecentInput?: boolean;
}

interface PerformanceMetrics {
  fcp: number;
  lcp: number;
  fid: number;
  cls: number;
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
          LoggingService.trackMetric('first_contentful_paint', entries[0].startTime, {
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
        LoggingService.trackMetric('largest_contentful_paint', lastEntry.startTime, {
          component: componentName
        });
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // Track FID
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach(entry => {
          const extendedEntry = entry as ExtendedPerformanceEntry;
          if (extendedEntry.processingStart) {
            const fidValue = extendedEntry.processingStart - entry.startTime;
            metrics.fid = fidValue;
            LoggingService.trackMetric('first_input_delay', fidValue, {
              component: componentName
            });
          }
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Track CLS
      const clsObserver = new PerformanceObserver((entryList) => {
        let clsScore = 0;
        entryList.getEntries().forEach(entry => {
          const extendedEntry = entry as ExtendedPerformanceEntry;
          if (!extendedEntry.hadRecentInput && extendedEntry.value) {
            clsScore += extendedEntry.value;
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
        const tags = {
          component: componentName,
          total: String(extendedPerf.memory.totalJSHeapSize),
          limit: String(extendedPerf.memory.jsHeapSizeLimit)
        };
        LoggingService.trackMetric('heap_used', extendedPerf.memory.usedJSHeapSize, tags);
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
          status: String(response.status)
        });
        return response;
      } catch (error: any) {
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
        metrics: JSON.stringify(metrics)
      });
    };
  }, [componentName]);
}