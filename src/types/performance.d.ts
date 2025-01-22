export interface BrowserInfo {
  userAgent: string;
  platform: string;
  language: string;
  viewport?: {
    width: number;
    height: number;
  };
  connection?: {
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
  };
}

export interface PerformanceData {
  id: string;
  metric_name: string;
  value: number;
  timestamp: string;
  component: string;
  page_url: string;
  user_id: string;
  browser_info: BrowserInfo;
  metadata: Record<string, any>;
}

export interface PerformanceMetrics {
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