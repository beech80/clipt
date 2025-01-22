import { useEffect } from 'react';
import LoggingService from '@/services/loggingService';

interface PerformanceEntry extends PerformanceEntryPolyfill {
  entryType: string;
  startTime: number;
  duration: number;
  name: string;
  interactionId?: number;
}

interface PerformanceEntryPolyfill {
  toJSON(): any;
}

export function usePerformanceMonitoring(componentName: string) {
  useEffect(() => {
    const startTime = performance.now();
    let metrics: Record<string, any>;

    // Track initial render performance
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: PerformanceEntry) => {
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
      list.getEntries().forEach((entry: PerformanceEntry) => {
        if (entry.duration > 50) {
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
      list.getEntries().forEach((entry: PerformanceResourceTiming) => {
        LoggingService.trackMetric('resource_timing', entry.duration, {
          component: componentName,
          resourceName: entry.name,
          initiatorType: entry.initiatorType,
          transferSize: entry.transferSize,
          encodedBodySize: entry.encodedBodySize
        });
      });
    });

    networkObserver.observe({ entryTypes: ['resource'] });

    // Track user interactions
    const interactionObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry: PerformanceEntry) => {
        LoggingService.trackMetric('interaction', entry.duration, {
          component: componentName,
          interactionId: entry.interactionId,
          type: entry.name
        });
      });
    });

    interactionObserver.observe({ entryTypes: ['first-input', 'event'] });

    // Periodic memory checks
    const memoryInterval = setInterval(trackMemoryUsage, 30000);

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