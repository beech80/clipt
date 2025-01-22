import { useEffect } from 'react';
import LoggingService from '@/services/loggingService';

interface PerformanceMetrics {
  timeToFirstByte: number;
  firstContentfulPaint: number;
  domInteractive: number;
  loadComplete: number;
  resourceTiming: {
    name: string;
    duration: number;
    startTime: number;
    initiatorType: string;
  }[];
  memoryUsage?: {
    jsHeapSizeLimit: number;
    totalJSHeapSize: number;
    usedJSHeapSize: number;
  };
}

export function usePerformanceMonitoring(componentName: string) {
  useEffect(() => {
    const startTime = performance.now();
    let metrics: PerformanceMetrics;

    // Track initial render performance
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        LoggingService.trackMetric(entry.name, entry.startTime, {
          component: componentName,
          duration: entry.duration,
          entryType: entry.entryType
        });
      });
    });

    observer.observe({ entryTypes: ['paint', 'resource', 'navigation'] });

    // Track memory usage if available
    const trackMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        LoggingService.trackMetric('memory_usage', memory.usedJSHeapSize, {
          component: componentName,
          heapLimit: memory.jsHeapSizeLimit,
          totalHeapSize: memory.totalJSHeapSize
        });
      }
    };

    // Track long tasks
    const longTaskObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.duration > 50) { // Tasks longer than 50ms
          LoggingService.trackMetric('long_task', entry.duration, {
            component: componentName,
            startTime: entry.startTime
          });
        }
      });
    });

    longTaskObserver.observe({ entryTypes: ['longtask'] });

    // Track network requests
    const networkObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        const resource = entry as PerformanceResourceTiming;
        LoggingService.trackMetric('resource_timing', resource.duration, {
          component: componentName,
          resourceName: resource.name,
          initiatorType: resource.initiatorType,
          transferSize: resource.transferSize,
          encodedBodySize: resource.encodedBodySize
        });
      });
    });

    networkObserver.observe({ entryTypes: ['resource'] });

    // Track user interactions
    const interactionObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        LoggingService.trackMetric('interaction', entry.duration, {
          component: componentName,
          interactionId: entry.id,
          type: entry.name
        });
      });
    });

    interactionObserver.observe({ entryTypes: ['first-input', 'event'] });

    // Periodic memory checks
    const memoryInterval = setInterval(trackMemoryUsage, 30000);

    // Cleanup
    return () => {
      observer.disconnect();
      longTaskObserver.disconnect();
      networkObserver.disconnect();
      interactionObserver.disconnect();
      clearInterval(memoryInterval);

      // Log component lifecycle
      LoggingService.trackMetric('component_lifecycle', performance.now() - startTime, {
        component: componentName,
        type: 'unmount'
      });
    };
  }, [componentName]);
}