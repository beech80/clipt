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

export function usePerformanceMonitoring(componentName: string) {
  useEffect(() => {
    const startTime = performance.now();

    // Track component mount time
    LoggingService.trackMetric('component_mount', performance.now() - startTime, {
      component: componentName
    });

    // Track memory usage if available
    const extendedPerf = performance as ExtendedPerformance;
    if (extendedPerf.memory) {
      LoggingService.trackMetric('heap_size', extendedPerf.memory.usedJSHeapSize, {
        component: componentName
      });
    }

    // Track page load metrics
    if (window.performance.timing) {
      const timing = window.performance.timing;
      const loadTime = timing.loadEventEnd - timing.navigationStart;
      const dnsTime = timing.domainLookupEnd - timing.domainLookupStart;
      const tcpTime = timing.connectEnd - timing.connectStart;
      const renderTime = timing.domComplete - timing.domLoading;

      LoggingService.trackMetric('page_load_time', loadTime, {
        component: componentName
      });
      LoggingService.trackMetric('dns_time', dnsTime, {
        component: componentName
      });
      LoggingService.trackMetric('tcp_time', tcpTime, {
        component: componentName
      });
      LoggingService.trackMetric('render_time', renderTime, {
        component: componentName
      });
    }

    // Track user interactions
    const interactionHandler = () => {
      LoggingService.trackMetric('user_interaction', 1, {
        component: componentName
      });
    };

    document.addEventListener('click', interactionHandler);
    document.addEventListener('keypress', interactionHandler);

    return () => {
      // Track component unmount
      LoggingService.trackMetric(
        'component_lifetime',
        performance.now() - startTime,
        { component: componentName }
      );

      // Clean up event listeners
      document.removeEventListener('click', interactionHandler);
      document.removeEventListener('keypress', interactionHandler);
    };
  }, [componentName]);
}