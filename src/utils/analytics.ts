import { posthog } from 'posthog-js';
import * as Sentry from "@sentry/browser";

export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  try {
    // Track event in PostHog
    posthog.capture(eventName, properties);

    // Log event to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics Event:', eventName, properties);
    }
  } catch (error) {
    // Report any tracking errors to Sentry
    Sentry.captureException(error);
    console.error('Error tracking event:', error);
  }
};

export const identifyUser = (userId: string, traits?: Record<string, any>) => {
  try {
    // Identify user in PostHog
    posthog.identify(userId, traits);

    // Set user context in Sentry
    Sentry.setUser({
      id: userId,
      ...traits
    });
  } catch (error) {
    Sentry.captureException(error);
    console.error('Error identifying user:', error);
  }
};

export const trackPageView = (pageName: string) => {
  try {
    // Track page view in PostHog
    posthog.capture('$pageview', {
      page: pageName
    });

    // Track page view in Google Analytics
    if (window.gtag) {
      window.gtag('event', 'page_view', {
        page_title: pageName,
        page_location: window.location.href,
        page_path: window.location.pathname
      });
    }
  } catch (error) {
    Sentry.captureException(error);
    console.error('Error tracking page view:', error);
  }
};