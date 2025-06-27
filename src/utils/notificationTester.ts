/**
 * Notification Browser Compatibility Testing Utility
 * 
 * This utility helps test push notification functionality across different browsers
 * and provides diagnostics for common notification issues.
 */

interface BrowserInfo {
  name: string;
  version: string;
  os: string;
  mobile: boolean;
  supportsPush: boolean;
  supportsNotifications: boolean;
}

interface TestResult {
  browser: BrowserInfo;
  permissionStatus: NotificationPermission;
  serviceWorkerSupport: boolean;
  pushManagerSupport: boolean;
  vapidSupport: boolean;
  subscriptionAttempt: boolean;
  subscriptionSuccess: boolean;
  notificationDisplayed: boolean;
  errors: string[];
}

export class NotificationTester {
  private results: TestResult[] = [];
  private testInProgress = false;
  private vapidPublicKey: string;

  constructor() {
    this.vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
    if (!this.vapidPublicKey) {
      console.error('VAPID public key not found in environment variables');
    }
  }

  /**
   * Gets information about the current browser
   */
  getBrowserInfo(): BrowserInfo {
    const ua = navigator.userAgent;
    const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    
    let browserName = 'Unknown';
    let browserVersion = 'Unknown';
    let os = 'Unknown';
    
    // Detect browser
    if (ua.indexOf('Firefox') > -1) {
      browserName = 'Firefox';
      browserVersion = ua.match(/Firefox\/([0-9.]+)/)![1];
    } else if (ua.indexOf('Edge') > -1 || ua.indexOf('Edg') > -1) {
      browserName = 'Edge';
      browserVersion = ua.match(/Edge?\/([0-9.]+)/)![1];
    } else if (ua.indexOf('Chrome') > -1) {
      browserName = 'Chrome';
      browserVersion = ua.match(/Chrome\/([0-9.]+)/)![1];
    } else if (ua.indexOf('Safari') > -1) {
      browserName = 'Safari';
      browserVersion = ua.match(/Safari\/([0-9.]+)/)![1];
    } else if (ua.indexOf('MSIE') > -1 || ua.indexOf('Trident') > -1) {
      browserName = 'Internet Explorer';
      browserVersion = ua.match(/MSIE ([0-9.]+)/)![1];
    }
    
    // Detect OS
    if (ua.indexOf('Windows') > -1) {
      os = 'Windows';
    } else if (ua.indexOf('Mac') > -1) {
      os = 'MacOS';
    } else if (ua.indexOf('Linux') > -1) {
      os = 'Linux';
    } else if (ua.indexOf('Android') > -1) {
      os = 'Android';
    } else if (ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) {
      os = 'iOS';
    }
    
    return {
      name: browserName,
      version: browserVersion,
      os,
      mobile,
      supportsPush: 'PushManager' in window,
      supportsNotifications: 'Notification' in window
    };
  }

  /**
   * Base64 to Uint8Array conversion for VAPID key
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  }

  /**
   * Tests if notifications are supported in this browser
   */
  async testNotificationSupport(): Promise<Partial<TestResult>> {
    const browserInfo = this.getBrowserInfo();
    const errors: string[] = [];
    
    if (!browserInfo.supportsNotifications) {
      errors.push('Notifications API is not supported in this browser');
    }
    
    if (!browserInfo.supportsPush) {
      errors.push('Push API is not supported in this browser');
    }
    
    if (!('serviceWorker' in navigator)) {
      errors.push('Service Workers are not supported in this browser');
    }
    
    // iOS Safari specific warning
    if (browserInfo.os === 'iOS' && browserInfo.name === 'Safari') {
      errors.push('iOS Safari has limited support for web push notifications');
    }
    
    return {
      browser: browserInfo,
      serviceWorkerSupport: 'serviceWorker' in navigator,
      pushManagerSupport: 'PushManager' in window,
      vapidSupport: 'PushManager' in window && 'getKey' in PushSubscription.prototype,
      permissionStatus: 'Notification' in window ? Notification.permission : 'denied',
      errors
    };
  }

  /**
   * Tests subscription process
   */
  async testSubscription(): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      });
      
      return !!subscription;
    } catch (error) {
      console.error('Subscription test failed:', error);
      return false;
    }
  }

  /**
   * Tests notification display
   */
  async testNotificationDisplay(): Promise<boolean> {
    try {
      if (Notification.permission !== 'granted') {
        return false;
      }
      
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification('Test Notification', {
        body: 'This is a test notification',
        icon: '/favicon.ico',
        tag: 'test-notification'
      });
      
      return true;
    } catch (error) {
      console.error('Notification display test failed:', error);
      return false;
    }
  }

  /**
   * Runs a complete set of tests and returns results
   */
  async runFullTest(): Promise<TestResult> {
    if (this.testInProgress) {
      throw new Error('Test already in progress');
    }
    
    this.testInProgress = true;
    const result = await this.testNotificationSupport() as TestResult;
    
    try {
      if (result.serviceWorkerSupport && result.pushManagerSupport) {
        result.subscriptionAttempt = true;
        result.subscriptionSuccess = await this.testSubscription();
        
        if (result.subscriptionSuccess) {
          result.notificationDisplayed = await this.testNotificationDisplay();
        }
      } else {
        result.subscriptionAttempt = false;
        result.subscriptionSuccess = false;
        result.notificationDisplayed = false;
      }
    } catch (error) {
      if (error instanceof Error) {
        result.errors.push(error.message);
      } else {
        result.errors.push('Unknown error during testing');
      }
    }
    
    this.testInProgress = false;
    this.results.push(result);
    return result;
  }

  /**
   * Generate diagnostic report based on test results
   */
  generateReport(): string {
    const latestResult = this.results[this.results.length - 1];
    if (!latestResult) {
      return 'No test has been run yet.';
    }
    
    let report = `## Push Notification Compatibility Report\n\n`;
    report += `### Browser Information\n`;
    report += `- Browser: ${latestResult.browser.name} ${latestResult.browser.version}\n`;
    report += `- Operating System: ${latestResult.browser.os}\n`;
    report += `- Device Type: ${latestResult.browser.mobile ? 'Mobile' : 'Desktop'}\n\n`;
    
    report += `### Core Features Support\n`;
    report += `- Notifications API: ${latestResult.browser.supportsNotifications ? '✅ Supported' : '❌ Not Supported'}\n`;
    report += `- Push API: ${latestResult.browser.supportsPush ? '✅ Supported' : '❌ Not Supported'}\n`;
    report += `- Service Workers: ${latestResult.serviceWorkerSupport ? '✅ Supported' : '❌ Not Supported'}\n`;
    report += `- VAPID Protocol: ${latestResult.vapidSupport ? '✅ Supported' : '❌ Not Supported'}\n\n`;
    
    report += `### Permission Status\n`;
    report += `- Current Permission: ${latestResult.permissionStatus === 'granted' ? '✅ Granted' : 
               latestResult.permissionStatus === 'denied' ? '❌ Denied' : '⚠️ Not Asked'}\n\n`;
    
    report += `### Functional Tests\n`;
    report += `- Subscription Attempt: ${latestResult.subscriptionAttempt ? '✅ Attempted' : '❌ Not Attempted'}\n`;
    report += `- Subscription Success: ${latestResult.subscriptionSuccess ? '✅ Successful' : '❌ Failed'}\n`;
    report += `- Notification Display: ${latestResult.notificationDisplayed ? '✅ Displayed' : '❌ Not Displayed'}\n\n`;
    
    if (latestResult.errors.length > 0) {
      report += `### Errors\n`;
      latestResult.errors.forEach(error => {
        report += `- ${error}\n`;
      });
      report += '\n';
    }
    
    report += `### Recommendations\n`;
    if (!latestResult.browser.supportsNotifications || !latestResult.browser.supportsPush) {
      report += `- This browser does not fully support web push notifications. Consider using a different browser like Chrome, Firefox, or Edge.\n`;
    }
    
    if (latestResult.permissionStatus === 'denied') {
      report += `- Notification permission is denied. The user will need to reset permissions in browser settings.\n`;
    }
    
    if (latestResult.browser.os === 'iOS') {
      report += `- iOS has limited support for web push notifications. Consider using native app notifications for iOS users.\n`;
    }
    
    return report;
  }

  /**
   * Clear all test results
   */
  clearResults(): void {
    this.results = [];
  }

  /**
   * Get all test results
   */
  getResults(): TestResult[] {
    return [...this.results];
  }
}

export const notificationTester = new NotificationTester();
